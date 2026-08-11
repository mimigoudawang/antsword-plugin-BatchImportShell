# 批量导入 Shell 插件 (BatchImportShell)

批量导入 AntSword Shell 配置，支持编码器、解码器、HTTP 配置。

## 功能特性

- ✅ **批量导入** — 支持 CSV 和 JSON 两种格式批量导入 Shell
- ✅ **编码器选择** — 支持 default/base64/chr/chr16/rot13 等所有内置和自定义编码器
- ✅ **解码器选择** — 支持 default/base64/rot13 等所有内置和自定义解码器
- ✅ **HTTP Headers** — 支持自定义 HTTP 请求头（如 Cookie、Authorization 等）
- ✅ **HTTP Body** — 支持自定义 HTTP POST Body 参数
- ✅ **忽略 HTTPS 证书** — 可选择忽略自签名证书错误
- ✅ **字符编码选择** — 支持 UTF8/GBK/BIG5/GB2312 等编码
- ✅ **URL 去重** — 自动跳过已存在的 Shell（URL+密码+类型 相同判定为重复）
- ✅ **无需重启** — 使用 IPC 方式正确添加 Shell，实时生效
- ✅ **数据验证** — 校验必填字段、Shell 类型合法性
- ✅ **快捷键** — Ctrl-S / Cmd-S 快速导入

## 使用方法

1. 在 AntSword 的 Shell 管理界面右键菜单中选择本插件
2. 在上方配置面板设置全局配置（编码器、解码器等）
3. 在下方编辑器中输入 Shell 数据（CSV 或 JSON 格式）
4. 点击工具栏「导入」按钮或按 Ctrl-S 执行导入

## 数据格式

### CSV 格式

支持带表头和不带表头两种方式：

**带表头（推荐）**：
```csv
url,pwd,note
http://target1.com/shell.php,password1,备注1
http://target2.com/shell.jsp,password2,备注2
```

**完整表头**：
```csv
url,pwd,note,type,encode,encoder,decoder,category
http://target1.com/shell.php,pass1,备注1,php,UTF8,base64,default,webshell
http://target2.com/shell.jsp,pass2,备注2,jsp,UTF8,default,default,default
```

**不带表头（默认顺序: url, pwd, note）**：
```csv
http://target1.com/shell.php,password1,备注1
http://target2.com/shell.jsp,password2,备注2
```

### JSON 格式

```json
[
  {
    "url": "http://target1.com/shell.php",
    "pwd": "password1",
    "note": "备注1",
    "type": "php",
    "encode": "UTF8",
    "encoder": "base64",
    "decoder": "default"
  },
  {
    "url": "http://target2.com/shell.jsp",
    "pwd": "password2",
    "note": "备注2",
    "type": "jsp",
    "encode": "UTF8",
    "encoder": "default",
    "decoder": "default",
    "http_headers": {
      "Cookie": "session=abc",
      "X-Custom-Header": "value"
    },
    "http_body": {
      "token": "12345",
      "extra_param": "value"
    }
  }
]
```

JSON 格式中，每条记录的字段可以覆盖全局配置。`http_headers` 和 `http_body` 为对象，可设置多个键值对，会与全局 HTTP 配置合并（单条优先）。

## 配置说明

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| 导入格式 | CSV 或 JSON | JSON |
| 分类 | Shell 分类名 | default |
| 字符编码 | 页面编码 | UTF8 |
| Shell 类型 | 脚本类型 | php |
| 编码器 | 请求编码器 | default |
| 解码器 | 响应解码器 | default |
| 忽略HTTPS证书 | 是否忽略证书错误 | 否 |
| HTTP Headers | 自定义请求头（JSON格式） | 空 |
| HTTP Body | 自定义POST参数（JSON格式） | 空 |
| URL去重 | 是否跳过已存在的Shell | 是 |

GPLv3
