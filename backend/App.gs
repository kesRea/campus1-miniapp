function doGet(e) {
  if (e && e.parameter && e.parameter.__campus_diag === 'ui8') {
    return ContentService.createTextOutput('CAMPUS_UI_V8_POLISHED');
  }

  if (e && e.parameter && e.parameter.__campus_diag === 'hmacv2') {
    return ContentService.createTextOutput('CAMPUS_AUTH_HMAC_V2_20261008');
  }

  const template = HtmlService.createTemplateFromFile('MiniApp');
  template.APP_TITLE = 'Campus №1 — База данных';
  template.APP_URL = getMiniAppUrl_();

  return template.evaluate()
    .setTitle('Campus №1 — База данных')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getMiniAppUrl_() {
  return PropertiesService.getScriptProperties().getProperty('MINI_APP_URL') ||
    'https://script.google.com/macros/s/AKfycbyNCrLjMu6UqP6UXrpT5IHfl8IyW8jh1ZX-C0hhKZhrSJOTFESz2EatUs0U7JoChmiS/exec';
}
