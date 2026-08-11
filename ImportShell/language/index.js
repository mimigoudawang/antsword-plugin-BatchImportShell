const LANG_MAP = {
  'zh': require('./zh'),
  'en': require('./en')
};

// 获取用户语言设置
let lang = antSword['storage']('language', '');
if (!lang) {
  lang = navigator.language.substr(0, 2).toLowerCase();
}

// 校验语言是否支持，默认英文
if (!LANG_MAP[lang]) {
  lang = 'en';
}

const langData = LANG_MAP[lang];
langData.__languages__ = Object.keys(LANG_MAP);

module.exports = langData;
