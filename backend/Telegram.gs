function sendMessage(chatId, text, keyboard) {

  const url =
    'https://api.telegram.org/bot' +
    TOKEN +
    '/sendMessage';

  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML'
  };

  if (keyboard) {
    payload.reply_markup = keyboard;
  }

  const response = UrlFetchApp.fetch(
    url,
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    }
  );

  console.log(response.getContentText());
}
function answerCallback(callbackId) {

  const url =
    'https://api.telegram.org/bot' +
    TOKEN +
    '/answerCallbackQuery';

  UrlFetchApp.fetch(
    url,
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        callback_query_id: callbackId
      }),
      muteHttpExceptions: true
    }
  );
}
