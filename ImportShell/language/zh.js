module.exports = {
  title: '批量导入Shell',
  success: '导入成功',
  error: '导入失败',
  warning: '警告',
  info: '提示',

  toolbar: {
    import: '导入',
    clear: '清空',
    sample: '示例'
  },

  form: {
    format: '导入格式',
    format_csv: 'CSV',
    format_json: 'JSON',
    category: '分类',
    encode: '字符编码',
    shellType: 'Shell类型',
    encoder: '编码器',
    decoder: '解码器',
    ignoreHttps: '忽略HTTPS证书',
    httpHeaders: 'HTTP Headers',
    httpBody: 'HTTP Body',
    headersPlaceholder: '如: {"Cookie":"sid=abc","X-Token":"xxx"}',
    bodyPlaceholder: '如: {"token":"12345","key":"value"}',
    dedup: 'URL去重'
  },

  core: {
    parseError: '数据解析失败',
    invalidFormat: '无效的数据格式',
    urlRequired: 'URL 不能为空',
    pwdRequired: '密码不能为空',
    invalidType: '不支持的Shell类型',
    invalidJson: 'HTTP配置JSON格式错误',
    imported: '成功导入 {success} 条',
    failed: '失败 {fail} 条',
    skipped: '跳过重复 {skip} 条',
    noData: '没有可导入的数据',
    dedupSkipped: 'URL已存在，已跳过'
  },

  sample: {
    csv: 'url,pwd,note\r\nhttp://target.com/shell.php,password,备注1\r\nhttp://target2.com/shell.jsp,password2,备注2',
    json: '[\r\n  {\r\n    "url": "http://target.com/shell.php",\r\n    "pwd": "password",\r\n    "note": "备注1",\r\n    "type": "php",\r\n    "encode": "UTF8",\r\n    "encoder": "default",\r\n    "decoder": "default"\r\n  },\r\n  {\r\n    "url": "http://target2.com/shell.jsp",\r\n    "pwd": "password2",\r\n    "note": "备注2",\r\n    "type": "jsp",\r\n    "encode": "UTF8",\r\n    "encoder": "default",\r\n    "decoder": "default",\r\n    "http_headers": {\r\n      "Cookie": "session=abc"\r\n    },\r\n    "http_body": {\r\n      "token": "12345"\r\n    }\r\n  }\r\n]'
  },

  confirm: {
    title: '导入完成',
    content: '导入完成，是否关闭窗口？'
  }
};
