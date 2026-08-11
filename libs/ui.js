/**
 * 批量导入 Shell UI 模块
 * 主窗口：工具栏 + Ace 编辑器（与原版一致的可靠结构）
 * 配置弹窗：编码器/解码器/HTTP 等设置
 */

const WIN = require('ui/window');
const LANG = require('../language');
const IMPORTER = require('./core');

// 合法的 Shell 类型列表
const SHELL_TYPES = [
  'asp', 'aspx', 'aspxcsharp', 'php', 'php4', 'phpraw',
  'jsp', 'jspjs', 'cmdlinux', 'pswindows', 'custom'
];

// 编码列表
const ENCODES = [
  'UTF8', 'GBK', 'BIG5', 'GB2312',
  'Euc-KR', 'Euc-JP', 'Shift_JIS',
  'ISO-8859-1', 'Windows-874', 'Windows-1251'
];

class UI {
  constructor() {
    // 默认配置
    this.config = {
      format: 'json',
      category: 'default',
      encode: 'UTF8',
      type: 'php',
      encoder: 'default',
      decoder: 'default',
      ignoreHttps: 0,
      httpHeaders: '',
      httpBody: '',
      dedup: true
    };

    // 创建窗口（与原版一致）
    this.win = new WIN({
      title: LANG.title,
      width: 660,
      height: 550
    });

    // 初始化界面
    this._initToolbar();
    this._initEditor();

    return {
      onImport: () => {},
      onAbout: () => {}
    };
  }

  /**
   * 初始化工具栏
   */
  _initToolbar() {
    const toolbar = this.win.win.attachToolbar();
    toolbar.loadStruct([
      { id: 'import', type: 'button', icon: 'sign-in', text: LANG.toolbar.import },
      { type: 'separator' },
      { id: 'clear', type: 'button', icon: 'remove', text: LANG.toolbar.clear },
      { type: 'separator' },
      { id: 'sample', type: 'button', icon: 'file-text-o', text: LANG.toolbar.sample },
      { type: 'separator' },
      { id: 'config', type: 'button', icon: 'cog', text: '配置' }
    ]);

    toolbar.attachEvent('onClick', (id) => {
      switch (id) {
        case 'import':
          this._doImport();
          break;
        case 'clear':
          if (this.editor) {
            this.editor.session.setValue('');
          }
          break;
        case 'sample':
          this._insertSample();
          break;
        case 'config':
          this._showConfigDialog();
          break;
      }
    });

    this.toolbar = toolbar;
  }

  /**
   * 初始化 Ace Editor（与原版一致）
   */
  _initEditor() {
    this.editor = ace.edit(this.win.win.cell.lastChild);
    this.editor.$blockScrolling = Infinity;
    this.editor.setTheme('ace/theme/tomorrow');
    this.editor.session.setMode('ace/mode/json');
    this.editor.session.setUseWrapMode(true);
    this.editor.session.setWrapLimitRange(null, null);

    this.editor.setOptions({
      fontSize: '14px',
      enableBasicAutocompletion: true,
      enableSnippets: true,
      enableLiveAutocompletion: true
    });

    // Ctrl-S / Cmd-S 快捷键触发导入
    this.editor.commands.addCommand({
      name: 'importShell',
      bindKey: { win: 'Ctrl-S', mac: 'Command-S' },
      exec: () => {
        this.toolbar.callEvent('onClick', ['import']);
      }
    });

    // 自动 resize
    this._resizeTimer = setInterval(() => {
      this.editor.resize();
    }, 200);

    // 窗口关闭时清理
    this.win.win.attachEvent('onClose', () => {
      clearInterval(this._resizeTimer);
      return true;
    });
  }

  /**
   * 弹出配置对话框
   */
  _showConfigDialog() {
    const self = this;
    const cfg = this.config;

    // 构建 HTML 表单
    const encoderOpts = this._buildSelectOptions(this._getEncoderList(cfg.type), cfg.encoder);
    const decoderOpts = this._buildSelectOptions(this._getDecoderList(cfg.type), cfg.decoder);
    const typeOpts = SHELL_TYPES.map(t =>
      `<option value="${t}" ${t === cfg.type ? 'selected' : ''}>${t}</option>`
    ).join('');
    const encodeOpts = ENCODES.map(e =>
      `<option value="${e}" ${e === cfg.encode ? 'selected' : ''}>${e}</option>`
    ).join('');
    const formatOpts = [
      { v: 'csv', t: LANG.form.format_csv },
      { v: 'json', t: LANG.form.format_json }
    ].map(o =>
      `<option value="${o.v}" ${o.v === cfg.format ? 'selected' : ''}>${o.t}</option>`
    ).join('');

    const html = `
      <div style="padding:12px;font-size:13px;font-family:Microsoft YaHei,sans-serif;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="width:100px;padding:4px 8px;text-align:right;">${LANG.form.format}</td>
            <td style="padding:4px;"><select id="_is_format" style="width:150px;">${formatOpts}</select></td>
            <td style="width:80px;padding:4px 8px;text-align:right;">${LANG.form.category}</td>
            <td style="padding:4px;"><input id="_is_category" style="width:150px;" value="${this._esc(cfg.category)}"/></td>
          </tr>
          <tr>
            <td style="padding:4px 8px;text-align:right;">${LANG.form.shellType}</td>
            <td style="padding:4px;">
              <select id="_is_shellType" style="width:150px;">${typeOpts}</select>
            </td>
            <td style="padding:4px 8px;text-align:right;">${LANG.form.encode}</td>
            <td style="padding:4px;">
              <select id="_is_encode" style="width:150px;">${encodeOpts}</select>
            </td>
          </tr>
          <tr>
            <td style="padding:4px 8px;text-align:right;">${LANG.form.encoder}</td>
            <td style="padding:4px;">
              <select id="_is_encoder" style="width:150px;">${encoderOpts}</select>
            </td>
            <td style="padding:4px 8px;text-align:right;">${LANG.form.decoder}</td>
            <td style="padding:4px;">
              <select id="_is_decoder" style="width:150px;">${decoderOpts}</select>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding:4px 8px;">
              <label><input type="checkbox" id="_is_ignoreHttps" ${cfg.ignoreHttps ? 'checked' : ''}/> ${LANG.form.ignoreHttps}</label>
            </td>
            <td colspan="2" style="padding:4px 8px;">
              <label><input type="checkbox" id="_is_dedup" ${cfg.dedup ? 'checked' : ''}/> ${LANG.form.dedup}</label>
            </td>
          </tr>
          <tr>
            <td style="padding:4px 8px;text-align:right;">${LANG.form.httpHeaders}</td>
            <td colspan="3" style="padding:4px;">
              <input id="_is_httpHeaders" style="width:100%;" value="${this._esc(cfg.httpHeaders)}" placeholder='${LANG.form.headersPlaceholder}'/>
            </td>
          </tr>
          <tr>
            <td style="padding:4px 8px;text-align:right;">${LANG.form.httpBody}</td>
            <td colspan="3" style="padding:4px;">
              <input id="_is_httpBody" style="width:100%;" value="${this._esc(cfg.httpBody)}" placeholder='${LANG.form.bodyPlaceholder}'/>
            </td>
          </tr>
        </table>
      </div>
    `;

    layer.open({
      type: 1,
      title: '导入配置',
      area: ['520px', '260px'],
      shadeClose: true,
      content: html,
      btn: ['确定', '取消'],
      yes: function(index) {
        // 读取表单值
        self.config.format = document.getElementById('_is_format').value;
        self.config.category = document.getElementById('_is_category').value || 'default';
        self.config.shellType = document.getElementById('_is_shellType').value;
        self.config.type = document.getElementById('_is_shellType').value;
        self.config.encode = document.getElementById('_is_encode').value;
        self.config.encoder = document.getElementById('_is_encoder').value;
        self.config.decoder = document.getElementById('_is_decoder').value;
        self.config.ignoreHttps = document.getElementById('_is_ignoreHttps').checked ? 1 : 0;
        self.config.dedup = document.getElementById('_is_dedup').checked;
        self.config.httpHeaders = document.getElementById('_is_httpHeaders').value;
        self.config.httpBody = document.getElementById('_is_httpBody').value;

        // 更新编辑器模式
        self._updateEditorMode(self.config.format);

        layer.close(index);
        toastr.success('配置已保存', antSword['language']['toastr']['success']);
      }
    });

    // 监听 Shell 类型变化，动态更新编码器/解码器
    setTimeout(() => {
      const typeSelect = document.getElementById('_is_shellType');
      if (typeSelect) {
        typeSelect.addEventListener('change', function() {
          const newType = this.value;
          // 更新编码器选项
          const encoderSelect = document.getElementById('_is_encoder');
          if (encoderSelect) {
            const encList = self._getEncoderList(newType);
            encoderSelect.innerHTML = self._buildSelectOptionsHtml(encList, 'default');
          }
          // 更新解码器选项
          const decoderSelect = document.getElementById('_is_decoder');
          if (decoderSelect) {
            const decList = self._getDecoderList(newType);
            decoderSelect.innerHTML = self._buildSelectOptionsHtml(decList, 'default');
          }
        });
      }
    }, 100);
  }

  /**
   * 获取指定类型的编码器列表
   */
  _getEncoderList(type) {
    const list = ['default'];
    const builtIn = (antSword['encoders'] && antSword['encoders'][type]) || [];
    builtIn.forEach(e => {
      if (e !== 'default' && list.indexOf(e) === -1) {
        list.push(e);
      }
    });
    return list;
  }

  /**
   * 获取指定类型的解码器列表
   */
  _getDecoderList(type) {
    const list = ['default'];
    const builtIn = (antSword['decoders'] && antSword['decoders'][type]) || [];
    builtIn.forEach(d => {
      if (d !== 'default' && list.indexOf(d) === -1) {
        list.push(d);
      }
    });
    return list;
  }

  /**
   * 构建 <option> HTML
   */
  _buildSelectOptions(items, selected) {
    return items.map(i =>
      `<option value="${i}" ${i === selected ? 'selected' : ''}>${i}</option>`
    ).join('');
  }

  _buildSelectOptionsHtml(items, selected) {
    return this._buildSelectOptions(items, selected);
  }

  /**
   * HTML 转义
   */
  _esc(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /**
   * 更新编辑器模式
   */
  _updateEditorMode(format) {
    if (!this.editor) return;
    if (format === 'json') {
      this.editor.session.setMode('ace/mode/json');
    } else {
      this.editor.session.setMode('ace/mode/text');
    }
  }

  /**
   * 执行导入
   */
  _doImport() {
    const content = this.editor.session.getValue();
    if (!content || !content.trim()) {
      toastr.warning(LANG.core.noData, LANG.warning);
      return;
    }

    const config = this.config;

    this.win.win.progressOn();

    new IMPORTER({
      content: content,
      format: config.format,
      config: config
    }).then((result) => {
      this.win.win.progressOff();

      if (result.status === 1) {
        // 全部通过 IPC 成功，无需重启
        toastr.success(result.msg, antSword['language']['toastr']['success']);
      } else if (result.status === 2) {
        // 部分通过降级写入，需要重启才生效
        toastr.warning(result.msg, antSword['language']['toastr']['success']);
      } else {
        toastr.error(result.msg || LANG.error, antSword['language']['toastr']['error']);
      }

      // 如果有详细错误，在控制台输出
      if (result.errors && result.errors.length > 0) {
        console.error('ImportShell errors:', result.errors);
      }

      // 如果需要重启（降级写入的 Shell）
      if (result.needRestart) {
        layer.confirm(
          '部分 Shell 因域名无法解析，已直接写入数据库。<br><b>需要重启蚁剑才能生效，是否立即重启？</b>',
          {
            icon: 2, shift: 6,
            title: LANG.confirm.title
          },
          (_) => {
            // 重启蚁剑
            antSword.remote.app.exit();
          },
          (_) => {
            layer.closeAll();
          }
        );
      } else {
        // 正常导入完成，询问是否关闭窗口
        layer.confirm(LANG.confirm.content, {
          icon: 2, shift: 6,
          title: LANG.confirm.title
        }, (_) => {
          layer.closeAll();
          this.win.win.close();
        }, (_) => {
          layer.closeAll();
        });
      }
    }).catch((err) => {
      toastr.error(err.message || LANG.core.parseError, antSword['language']['toastr']['error']);
      this.win.win.progressOff();
    });
  }

  /**
   * 插入格式示例
   */
  _insertSample() {
    const format = this.config.format;
    let sample = '';
    if (format === 'csv') {
      sample = LANG.sample.csv;
    } else {
      sample = LANG.sample.json;
    }
    this.editor.session.setValue(sample);
  }
}

module.exports = UI;
