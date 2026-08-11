/**
 * 批量导入 Shell 插件入口
 *
 * 改进自 ImportShell-master：
 * - 使用 IPC shell-add 正确添加 Shell，无需重启
 * - 支持编码器/解码器选择
 * - 支持 HTTP Headers/Body 配置
 * - 支持忽略 HTTPS 证书
 * - 支持 CSV + JSON 双格式
 * - 支持 URL 去重
 */

const UI = require('./libs/ui');

class Plugin {
  constructor(opt) {
    new UI();
  }
}

module.exports = Plugin;
