function saveStudent(chatId, state) {

  const sheet = SpreadsheetApp
    .openById(SS_ID)
    .getSheets()[0];

  const lastRow = sheet.getLastRow();

  const number = lastRow;

  sheet.appendRow([
    number,
    state.data.fio,
    state.data.dateIn,
    state.data.birthDate,
    state.data.iin,
    state.data.faculty,
    state.data.room,
    state.data.registration,
    state.data.payment,
    ''
  ]);

  // Записываем действие в журнал
  logAction(
    '➕ Добавление',
    state.data.fio,
    'Комната: ' + state.data.room
  );

  PropertiesService
    .getScriptProperties()
    .deleteProperty('STATE_' + chatId);

  sendMessage(
    chatId,
    '✅ <b>Студент успешно добавлен!</b>\n\n' +
    '👤 ФИО: ' + state.data.fio + '\n' +
    '📅 Заселение: ' + state.data.dateIn + '\n' +
    '🎂 Рождение: ' + state.data.birthDate + '\n' +
    '🪪 ИИН/паспорт: ' + state.data.iin + '\n' +
    '🎓 Факультет: ' + state.data.faculty + '\n' +
    '🏠 Комната: ' + state.data.room + '\n' +
    '📍 Прописка: ' + state.data.registration + '\n' +
    '💰 Оплата: ' + state.data.payment,
    {
      inline_keyboard: [
        [
          {
            text: '🏠 Главное меню',
            callback_data: 'menu'
          }
        ]
      ]
    }
  );
}
function findStudent(chatId, searchText) {

  const sheet = SpreadsheetApp
    .openById(SS_ID)
    .getSheets()[0];

  // Display values keep long IIN/passport values exactly as shown in the sheet.
  const data = sheet.getDataRange().getDisplayValues();

  if (data.length <= 1) {
    sendMessage(
      chatId,
      '❌ В таблице пока нет студентов.',
      {
        inline_keyboard: [
          [
            {
              text: '🏠 Главное меню',
              callback_data: 'menu'
            }
          ]
        ]
      }
    );
    return;
  }

  const search = String(searchText || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();

  const searchDigits = String(searchText || '')
    .replace(/\D/g, '');

  if (!search) {
    sendMessage(chatId, '❌ Введите ФИО или ИИН/паспорт.');
    return;
  }

  const found = [];
  const words = search
    .split(' ')
    .filter(function(word) {
      return word.length >= 2;
    });

  for (let i = 1; i < data.length; i++) {

    const row = data[i];

    const fio = String(row[1] || '')
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/\s+/g, ' ')
      .trim();

    const iin = String(row[4] || '').trim();
    const iinDigits = iin.replace(/\D/g, '');

    if (!fio && !iin) {
      continue;
    }

    let fioMatch = fio.includes(search);

    if (
      !fioMatch &&
      words.length > 1 &&
      words.every(function(word) {
        return fio.includes(word);
      })
    ) {
      fioMatch = true;
    }

    const iinMatch =
      searchDigits.length >= 4 &&
      iinDigits.includes(searchDigits);

    if (fioMatch || iinMatch) {
      found.push(row);
    }
  }

  if (found.length === 0) {
    sendMessage(
      chatId,
      '❌ <b>Студент не найден.</b>\n\n' +
      'По запросу: <code>' +
      escapeHtml(searchText) +
      '</code>',
      {
        inline_keyboard: [
          [
            {
              text: '🔎 Новый поиск',
              callback_data: 'find_student'
            }
          ],
          [
            {
              text: '🏠 Главное меню',
              callback_data: 'menu'
            }
          ]
        ]
      }
    );
    return;
  }

  for (let i = 0; i < found.length; i++) {

    const row = found[i];

    const number = row[0] || '';
    const fio = row[1] || '';
    const dateIn = row[2] || '';
    const birthDate = row[3] || '';
    const iin = row[4] || '';
    const faculty = row[5] || '';
    const room = row[6] || '';
    const registration = row[7] || '';
    const payment = row[8] || '';
    const evictionDate = row[9] || '';

    let message =
      '👤 <b>СТУДЕНТ №' + escapeHtml(number) + '</b>\n\n' +
      'ФИО: <b>' + escapeHtml(fio) + '</b>\n' +
      '📅 Заселение: ' + escapeHtml(dateIn) + '\n' +
      '🎂 Дата рождения: ' + escapeHtml(birthDate) + '\n' +
      '🪪 ИИН/паспорт: ' + escapeHtml(iin) + '\n' +
      '🎓 Факультет: ' + escapeHtml(faculty) + '\n' +
      '🏠 Комната: <b>' + escapeHtml(room) + '</b>\n' +
      '📍 Прописка: ' + escapeHtml(registration) + '\n' +
      '💰 Оплата: ' + escapeHtml(payment) + '\n';

    if (evictionDate) {
      message +=
        '📤 Дата выселения: ' +
        escapeHtml(evictionDate);
    } else {
      message +=
        '🏠 Статус: <b>Проживает</b>';
    }

    sendMessage(chatId, message);
  }

  sendMessage(
    chatId,
    'Выберите следующее действие:',
    {
      inline_keyboard: [
        [
          {
            text: '🔎 Новый поиск',
            callback_data: 'find_student'
          }
        ],
        [
          {
            text: '🏠 Главное меню',
            callback_data: 'menu'
          }
        ]
      ]
    }
  );
}

function editStudent(chatId, searchText) {

  const sheet = SpreadsheetApp
    .openById(SS_ID)
    .getSheets()[0];

  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {

    sendMessage(
      chatId,
      '❌ В таблице пока нет студентов.',
      {
        inline_keyboard: [
          [
            {
              text: '🏠 Главное меню',
              callback_data: 'menu'
            }
          ]
        ]
      }
    );

    return;
  }

  const search = String(searchText || '')
    .trim()
    .toLowerCase();

  if (!search) {

    sendMessage(
      chatId,
      '❌ Введите ФИО или ИИН/паспорт.'
    );

    return;
  }

  const exactMatches = [];
  const possibleMatches = [];

  for (let i = 1; i < data.length; i++) {

    const row = data[i];

    const fio = String(row[1] || '').trim();
    const iin = String(row[4] || '').trim();
    const room = String(row[6] || '').trim();
    const evictionDate = row[9] || '';

    // Выселенных не показываем
    if (evictionDate) {
      continue;
    }

    const fioLower = fio.toLowerCase();
    const iinLower = iin.toLowerCase();

    // =========================
    // ТОЧНОЕ / ЧАСТИЧНОЕ СОВПАДЕНИЕ
    // =========================

    if (
      fioLower.includes(search) ||
      iinLower.includes(search)
    ) {

      exactMatches.push({
        rowNumber: i + 1,
        fio: fio,
        room: room
      });

      continue;
    }

    // =========================
    // ПОХОЖЕЕ ФИО
    // =========================

    const words = search
      .split(/\s+/)
      .filter(function(word) {
        return word.length >= 2;
      });

    let matchedWords = 0;

    for (let j = 0; j < words.length; j++) {

      if (fioLower.includes(words[j])) {
        matchedWords++;
      }
    }

    if (
      matchedWords > 0 &&
      words.length > 0
    ) {

      possibleMatches.push({
        rowNumber: i + 1,
        fio: fio,
        room: room,
        matchedWords: matchedWords
      });
    }
  }

  // =========================
  // ЕСТЬ ТОЧНЫЕ СОВПАДЕНИЯ
  // =========================

  if (exactMatches.length > 0) {

    if (exactMatches.length === 1) {

      const student = exactMatches[0];

      openEditStudent(chatId, student.rowNumber);

      return;
    }

    let message =
      '✏️ <b>Найдено несколько студентов</b>\n\n' +
      'Выберите нужного студента:';

    const keyboard = [];

    for (let i = 0; i < exactMatches.length; i++) {

      const student = exactMatches[i];

      keyboard.push([
        {
          text:
            '👤 ' +
            student.fio +
            ' — комната ' +
            student.room,

          callback_data:
            'edit_select_student_' +
            student.rowNumber
        }
      ]);
    }

    keyboard.push([
      {
        text: '🏠 Главное меню',
        callback_data: 'menu'
      }
    ]);

    sendMessage(
      chatId,
      message,
      {
        inline_keyboard: keyboard
      }
    );

    return;
  }

  // =========================
  // ПОХОЖИЕ СОВПАДЕНИЯ
  // =========================

  if (possibleMatches.length > 0) {

    possibleMatches.sort(function(a, b) {
      return b.matchedWords - a.matchedWords;
    });

    let message =
      '🔎 <b>Студент точно не найден.</b>\n\n' +
      'Возможно, вы ищете одного из них:';

    const keyboard = [];

    const limit =
      Math.min(possibleMatches.length, 8);

    for (let i = 0; i < limit; i++) {

      const student = possibleMatches[i];

      keyboard.push([
        {
          text:
            '👤 ' +
            student.fio +
            ' — комната ' +
            student.room,

          callback_data:
            'edit_select_student_' +
            student.rowNumber
        }
      ]);
    }

    keyboard.push([
      {
        text: '🔄 Попробовать снова',
        callback_data: 'edit_manual'
      }
    ]);

    keyboard.push([
      {
        text: '🏠 Главное меню',
        callback_data: 'menu'
      }
    ]);

    sendMessage(
      chatId,
      message,
      {
        inline_keyboard: keyboard
      }
    );

    return;
  }

  // =========================
  // НИЧЕГО НЕ НАЙДЕНО
  // =========================

  sendMessage(
    chatId,
    '❌ <b>Студент не найден.</b>\n\n' +
    'По запросу: <code>' +
    escapeHtml(searchText) +
    '</code>',
    {
      inline_keyboard: [
        [
          {
            text: '🔄 Попробовать снова',
            callback_data: 'edit_manual'
          }
        ],
        [
          {
            text: '🏠 Главное меню',
            callback_data: 'menu'
          }
        ]
      ]
    }
  );
}
function openEditStudent(chatId, rowNumber) {

  const sheet = SpreadsheetApp
    .openById(SS_ID)
    .getSheets()[0];

  const row = sheet
    .getRange(rowNumber, 1, 1, 10)
    .getValues()[0];

  const evictionDate = row[9] || '';

  if (evictionDate) {

    sendMessage(
      chatId,
      '❌ Этот студент уже выселен.',
      {
        inline_keyboard: [
          [
            {
              text: '🏠 Главное меню',
              callback_data: 'menu'
            }
          ]
        ]
      }
    );

    return;
  }

  PropertiesService
    .getScriptProperties()
    .setProperty(
      'EDIT_' + chatId,
      JSON.stringify({
        rowNumber: rowNumber,
        fio: row[1] || ''
      })
    );

  sendMessage(
    chatId,
    '✏️ <b>Редактирование студента</b>\n\n' +
    '👤 Студент: <b>' +
    escapeHtml(row[1] || '') +
    '</b>\n' +
    '🏠 Комната: <b>' +
    escapeHtml(row[6] || '') +
    '</b>\n\n' +
    'Выберите, что хотите изменить:',
    {
      inline_keyboard: [
        [
          {
            text: '👤 ФИО',
            callback_data: 'edit_fio'
          }
        ],
        [
          {
            text: '📅 Дата заселения',
            callback_data: 'edit_dateIn'
          }
        ],
        [
          {
            text: '🎂 Дата рождения',
            callback_data: 'edit_birthDate'
          }
        ],
        [
          {
            text: '🪪 ИИН / паспорт',
            callback_data: 'edit_iin'
          }
        ],
        [
          {
            text: '🎓 Факультет',
            callback_data: 'edit_faculty'
          }
        ],
        [
          {
            text: '🏠 Комната',
            callback_data: 'edit_room'
          }
        ],
        [
          {
            text: '📍 Прописка',
            callback_data: 'edit_registration'
          }
        ],
        [
          {
            text: '💰 Оплата',
            callback_data: 'edit_payment'
          }
        ],
        [
          {
            text: '❌ Отмена',
            callback_data: 'menu'
          }
        ]
      ]
    }
  );
}
