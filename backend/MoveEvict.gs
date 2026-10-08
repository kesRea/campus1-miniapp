function moveStudent(chatId, searchText) {

  if (!hasPermission(chatId, 'manage_students')) {
    sendNoPermission(chatId);
    return;
  }

  const sheet =
    SpreadsheetApp
      .openById(SS_ID)
      .getSheets()[0];

  const data =
    sheet
      .getDataRange()
      .getValues();

  const search =
    String(searchText || '')
      .trim()
      .toLowerCase();

  if (!search) {
    sendMessage(
      chatId,
      '❌ <b>Введите ФИО, ИИН/паспорт или номер комнаты.</b>'
    );
    return;
  }

  const found = [];

  for (let i = 1; i < data.length; i++) {

    const row = data[i];

    const fio =
      String(row[1] || '')
        .trim();

    const iin =
      String(row[4] || '')
        .trim();

    const room =
      String(row[6] || '')
        .trim();

    const evictionDate =
      String(row[9] || '')
        .trim();

    // Пропускаем пустые строки
    if (!fio) {
      continue;
    }

    // Уже выселенных не показываем
    if (evictionDate) {
      continue;
    }

    const fioSearch =
      fio.toLowerCase();

    const iinSearch =
      iin.toLowerCase();

    const roomSearch =
      room.toLowerCase();

    if (
      fioSearch.indexOf(search) !== -1 ||
      iinSearch.indexOf(search) !== -1 ||
      roomSearch === search
    ) {

      found.push({
        rowNumber: i + 1,
        fio: fio,
        iin: iin,
        room: room
      });

    }

  }


  // =====================================================
  // НИЧЕГО НЕ НАЙДЕНО
  // =====================================================

  if (found.length === 0) {

    sendMessage(
      chatId,
      '❌ <b>Студент не найден.</b>\n\n' +
      'Проверьте ФИО, ИИН/паспорт или номер комнаты.',
      {
        inline_keyboard: [
          [
            {
              text: '🔄 Попробовать снова',
              callback_data: 'move_student'
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


  // =====================================================
  // НАЙДЕН ОДИН СТУДЕНТ
  // =====================================================

  if (found.length === 1) {

    const student =
      found[0];

    PropertiesService
      .getScriptProperties()
      .setProperty(
        'MOVE_' + chatId,
        JSON.stringify({
          rowNumber: student.rowNumber,
          fio: student.fio,
          oldRoom: student.room
        })
      );

    PropertiesService
      .getScriptProperties()
      .setProperty(
        'STATE_' + chatId,
        JSON.stringify({
          step: 'move_room'
        })
      );

    sendMessage(
      chatId,
      '🔄 <b>Переселение студента</b>\n\n' +
      '👤 ФИО: <b>' +
      escapeHtml(student.fio) +
      '</b>\n' +
      '🏠 Текущая комната: <b>' +
      escapeHtml(student.room || 'Не указана') +
      '</b>\n\n' +
      '🏠 Введите новый номер комнаты:\n' +
      '<i>Например: 130</i>',
      {
        inline_keyboard: [
          [
            {
              text: '❌ Отмена',
              callback_data: 'menu'
            }
          ]
        ]
      }
    );

    return;
  }


  // =====================================================
  // НАЙДЕНО НЕСКОЛЬКО
  // =====================================================

  const keyboard = [];

  found.forEach(function(student) {

    keyboard.push([
      {
        text:
          '👤 ' +
          student.fio +
          ' — 🚪 ' +
          (student.room || '—'),

        callback_data:
          'move_select_' +
          student.rowNumber
      }
    ]);

  });

  keyboard.push([
    {
      text: '❌ Отмена',
      callback_data: 'menu'
    }
  ]);


  sendMessage(
    chatId,
    '🔄 <b>Найдено несколько студентов</b>\n\n' +
    'Выберите нужного студента:',
    {
      inline_keyboard: keyboard
    }
  );
}