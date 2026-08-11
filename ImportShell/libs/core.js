/**
 * 批量导入 Shell 核心逻辑
 * 优先使用 IPC shell-add（无需重启）
 * DNS 解析失败时降级为直接写入 nedb 文件（需重启生效）
 */

const LANG = require('../language');
const fs = require('fs');
const path = require('path');

// 合法的 Shell 类型
const VALID_TYPES = [
  'asp', 'aspx', 'aspxcsharp', 'php', 'php4', 'phpraw',
  'jsp', 'jspjs', 'cmdlinux', 'pswindows', 'custom'
];

// otherConf 完整默认值（与蚁剑 form.js _createOtherForm 一致）
const OTHER_CONF_DEFAULTS = {
  'ignore-https': 0,
  'use-raw-body': 0,
  'use-multipart': 0,
  'add-MassData': 0,
  'random-Prefix': '2',
  'use-random-variable': 0,
  'use-chunk': 0,
  'chunk-step-byte-min': 2,
  'chunk-step-byte-max': 3,
  'terminal-cache': 0,
  'filemanager-cache': 1,
  'upload-fragment': '500',
  'request-timeout': '10000',
  'command-path': '',
  'use-custom-datatag': 0,
  'custom-datatag-tags': '',
  'custom-datatag-tage': ''
};

class Importer {
  /**
   * @param {Object} argv - 导入参数
   * @param {String} argv.content - 编辑器内容（CSV 或 JSON 文本）
   * @param {String} argv.format - 导入格式 'csv' | 'json'
   * @param {Object} argv.config - 全局配置
   */
  constructor(argv) {
    return new Promise((resolve, reject) => {
      try {
        const result = this._import(argv);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * 执行导入
   */
  _import(argv) {
    const { content, format, config } = argv;

    // 1. 解析数据
    let records;
    if (format === 'csv') {
      records = this._parseCSV(content);
    } else {
      records = this._parseJSON(content);
    }

    if (!records || records.length === 0) {
      return { status: 0, msg: LANG.core.noData };
    }

    // 2. 解析全局 HTTP 配置
    let globalHeaders = {};
    let globalBody = {};
    try {
      if (config.httpHeaders && config.httpHeaders.trim()) {
        globalHeaders = JSON.parse(config.httpHeaders);
      }
    } catch (e) {
      return { status: 0, msg: `HTTP Headers: ${LANG.core.invalidJson} - ${e.message}` };
    }
    try {
      if (config.httpBody && config.httpBody.trim()) {
        globalBody = JSON.parse(config.httpBody);
      }
    } catch (e) {
      return { status: 0, msg: `HTTP Body: ${LANG.core.invalidJson} - ${e.message}` };
    }

    // 3. 获取已有 Shell 列表（用于去重）
    let existingShells = [];
    if (config.dedup) {
      try {
        existingShells = antSword.ipcRenderer.sendSync('shell-find', {});
      } catch (e) {}
    }
    const existingKeys = new Set(
      existingShells.map(s => `${s.url}|${s.pwd}|${s.type}`)
    );

    // 4. 逐条导入
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;
    let fallbackCount = 0;  // 降级写入的数量
    const errors = [];
    const fallbackDocs = [];  // 需要降级写入的文档

    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      // 校验必填字段
      const url = (record.url || '').trim();
      const pwd = (record.pwd || '').trim();
      if (!url) {
        errors.push(`Row ${i + 1}: ${LANG.core.urlRequired}`);
        failCount++;
        continue;
      }
      if (!pwd) {
        errors.push(`Row ${i + 1}: ${LANG.core.pwdRequired}`);
        failCount++;
        continue;
      }

      // 合并配置：全局配置为基础，单条记录可覆盖
      const type = this._validateType(record.type || config.type);
      const encode = record.encode || config.encode;
      const encoder = record.encoder || config.encoder;
      const decoder = record.decoder || config.decoder;
      const category = record.category || config.category;
      const note = record.note || '';

      // 去重检查
      if (config.dedup && existingKeys.has(`${url}|${pwd}|${type}`)) {
        skipCount++;
        continue;
      }

      // 构建 HTTP 配置
      let headers = { ...globalHeaders };
      let body = { ...globalBody };
      const recHeaders = record.http_headers || record.httpHeaders;
      const recBody = record.http_body || record.httpBody;
      if (recHeaders && typeof recHeaders === 'object') {
        headers = { ...headers, ...recHeaders };
      }
      if (recBody && typeof recBody === 'object') {
        body = { ...body, ...recBody };
      }

      // 构建 otherConf（合并默认值 + 用户配置）
      const otherConf = Object.assign({}, OTHER_CONF_DEFAULTS, {
        'ignore-https': config.ignoreHttps ? 1 : 0
      });

      // 构建 shell-add 数据
      const shellData = {
        base: {
          url: url,
          pwd: pwd,
          note: note,
          type: type,
          encode: encode,
          encoder: encoder,
          decoder: decoder,
          category: category
        },
        http: {
          headers: headers,
          body: body
        },
        other: otherConf
      };

      // 调用 IPC 添加 Shell
      try {
        const ret = antSword.ipcRenderer.sendSync('shell-add', shellData);
        // addShell 返回值判断：
        //   成功: nedb 文档对象 (含 _id 字段)
        //   失败: 错误字符串 (如 DNS 解析失败 "Error: getaddrinfo ENOTFOUND...")
        //         或 "Blacklist URL"
        if (ret && typeof ret === 'object' && ret._id) {
          successCount++;
          if (config.dedup) {
            existingKeys.add(`${url}|${pwd}|${type}`);
          }
        } else {
          // IPC 添加失败（通常因 DNS 解析失败），走降级方案
          const errMsg = (typeof ret === 'string') ? ret : 'IPC shell-add failed';
          if (errMsg.indexOf('ENOTFOUND') !== -1 || errMsg.indexOf('EAI_NODATA') !== -1 || errMsg.indexOf('getaddrinfo') !== -1) {
            // DNS 失败 — 构造完整 nedb 文档，稍后直接写入文件
            const now = +new Date();
            fallbackDocs.push({
              category: category || 'default',
              url: url,
              pwd: pwd,
              note: note,
              type: type,
              ip: '',
              addr: 'Unknown',
              encode: encode,
              encoder: encoder,
              decoder: decoder,
              httpConf: { headers: headers, body: body },
              otherConf: otherConf,
              ctime: now,
              utime: now
            });
            fallbackCount++;
            if (config.dedup) {
              existingKeys.add(`${url}|${pwd}|${type}`);
            }
          } else {
            failCount++;
            errors.push(`Row ${i + 1}: ${errMsg}`);
          }
        }
      } catch (err) {
        failCount++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    // 5. 降级写入：将 DNS 失败的 Shell 直接追加到 nedb 文件
    if (fallbackDocs.length > 0) {
      try {
        const dbPath = path.join(process.env.AS_WORKDIR, 'antData', 'db.ant');
        // nedb 每行是一个 JSON 文档，追加即可
        const lines = fallbackDocs.map(doc => JSON.stringify(doc)).join('\n') + '\n';
        fs.appendFileSync(dbPath, lines, 'utf8');
        successCount += fallbackCount;
      } catch (err) {
        failCount += fallbackCount;
        errors.push(`Fallback write failed: ${err.message}`);
        fallbackCount = 0;
      }
    }

    // 6. 构建结果消息
    let msg = LANG.core.imported.replace('{success}', successCount);
    if (failCount > 0) {
      msg += ', ' + LANG.core.failed.replace('{fail}', failCount);
    }
    if (skipCount > 0) {
      msg += ', ' + LANG.core.skipped.replace('{skip}', skipCount);
    }

    return {
      // status: 1=全部成功无需重启, 2=成功但需重启, 0=无成功
      status: successCount > 0 ? (fallbackCount > 0 ? 2 : 1) : 0,
      msg: msg,
      success: successCount,
      fail: failCount,
      skip: skipCount,
      needRestart: fallbackCount > 0,
      errors: errors
    };
  }

  /**
   * 校验 Shell 类型合法性
   */
  _validateType(type) {
    if (VALID_TYPES.indexOf(type) !== -1) {
      return type;
    }
    const lower = (type || '').toLowerCase();
    for (const t of VALID_TYPES) {
      if (t === lower) return t;
    }
    return 'custom';
  }

  /**
   * 解析 CSV 格式
   */
  _parseCSV(content) {
    if (!content || !content.trim()) return [];

    const lines = content.trim().split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return [];

    const records = [];
    const firstLine = lines[0].trim().toLowerCase();
    const hasHeader = firstLine.includes('url') && (firstLine.includes('pwd') || firstLine.includes('password'));

    let startIndex = 0;
    let fieldMap = { 0: 'url', 1: 'pwd', 2: 'note' };

    if (hasHeader) {
      startIndex = 1;
      const headers = this._splitCSVLine(lines[0]);
      headers.forEach((h, idx) => {
        const header = h.trim().toLowerCase();
        if (header === 'url') fieldMap[idx] = 'url';
        else if (header === 'pwd' || header === 'password') fieldMap[idx] = 'pwd';
        else if (header === 'note' || header === 'remark') fieldMap[idx] = 'note';
        else if (header === 'type' || header === 'shelltype') fieldMap[idx] = 'type';
        else if (header === 'encode' || header === 'encoding') fieldMap[idx] = 'encode';
        else if (header === 'encoder') fieldMap[idx] = 'encoder';
        else if (header === 'decoder') fieldMap[idx] = 'decoder';
        else if (header === 'category' || header === 'cat') fieldMap[idx] = 'category';
      });
    }

    for (let i = startIndex; i < lines.length; i++) {
      const fields = this._splitCSVLine(lines[i]);
      const record = {};
      for (const idx in fieldMap) {
        record[fieldMap[idx]] = (fields[parseInt(idx)] || '').trim();
      }
      if (record.url) {
        records.push(record);
      }
    }

    return records;
  }

  /**
   * 简易 CSV 行分割（支持引号内逗号）
   */
  _splitCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  /**
   * 解析 JSON 格式
   */
  _parseJSON(content) {
    if (!content || !content.trim()) return [];

    try {
      const data = JSON.parse(content);
      if (Array.isArray(data)) {
        return data.filter(item => item && typeof item === 'object');
      } else if (typeof data === 'object') {
        return [data];
      }
      return [];
    } catch (e) {
      throw new Error(`${LANG.core.parseError}: ${e.message}`);
    }
  }
}

module.exports = Importer;
