module.exports = {
  title: 'Batch Import Shell',
  success: 'Import Success',
  error: 'Import Error',
  warning: 'Warning',
  info: 'Info',

  toolbar: {
    import: 'Import',
    clear: 'Clear',
    sample: 'Sample'
  },

  form: {
    format: 'Format',
    format_csv: 'CSV',
    format_json: 'JSON',
    category: 'Category',
    encode: 'Encoding',
    shellType: 'Shell Type',
    encoder: 'Encoder',
    decoder: 'Decoder',
    ignoreHttps: 'Ignore HTTPS Cert',
    httpHeaders: 'HTTP Headers',
    httpBody: 'HTTP Body',
    headersPlaceholder: 'e.g.: {"Cookie":"sid=abc","X-Token":"xxx"}',
    bodyPlaceholder: 'e.g.: {"token":"12345","key":"value"}',
    dedup: 'URL Dedup'
  },

  core: {
    parseError: 'Data parse error',
    invalidFormat: 'Invalid data format',
    urlRequired: 'URL is required',
    pwdRequired: 'Password is required',
    invalidType: 'Unsupported shell type',
    invalidJson: 'Invalid HTTP config JSON format',
    imported: 'Successfully imported {success} shell(s)',
    failed: 'Failed {fail} shell(s)',
    skipped: 'Skipped {skip} duplicate(s)',
    noData: 'No data to import',
    dedupSkipped: 'URL already exists, skipped'
  },

  sample: {
    csv: 'url,pwd,note\r\nhttp://target.com/shell.php,password,note1\r\nhttp://target2.com/shell.jsp,password2,note2',
    json: '[\r\n  {\r\n    "url": "http://target.com/shell.php",\r\n    "pwd": "password",\r\n    "note": "note1",\r\n    "type": "php",\r\n    "encode": "UTF8",\r\n    "encoder": "default",\r\n    "decoder": "default"\r\n  },\r\n  {\r\n    "url": "http://target2.com/shell.jsp",\r\n    "pwd": "password2",\r\n    "note": "note2",\r\n    "type": "jsp",\r\n    "encode": "UTF8",\r\n    "encoder": "default",\r\n    "decoder": "default",\r\n    "http_headers": {\r\n      "Cookie": "session=abc"\r\n    },\r\n    "http_body": {\r\n      "token": "12345"\r\n    }\r\n  }\r\n]'
  },

  confirm: {
    title: 'Import Complete',
    content: 'Import complete. Close the window?'
  }
};
