function doPost(e) {
  // Campus Mini App API. Telegram webhook requests do not have campus_api=1.
  if (e && e.parameter && String(e.parameter.campus_api || '') === '1') {
    return handleCampusMiniAppApi_(e);
  }


  try {

    const update =
      JSON.parse(e.postData.contents);

    const props =
      PropertiesService.getScriptProperties();


    // =====================================================
    // CALLBACK-КНОПКИ
    // =====================================================

    if (update.callback_query) {

      const callback =
        update.callback_query;

      const chatId =
        callback.message.chat.id;

      const action =
        callback.data;

      answerCallback(callback.id);


      // =====================================================
      // СОХРАНЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ
      // =====================================================

      if (callback.from) {

        saveUserInfo(
          chatId,
          callback.from.username || '',
          callback.from.first_name || '',
          callback.from.last_name || ''
        );

      }


      // =====================================================
      // ЗАПРОС ДОСТУПА
      // =====================================================

      if (action === 'request_access') {

        requestAccess(
          chatId,
          callback.from.username,
          callback.from.first_name
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // РАЗРЕШЕНИЕ ДОСТУПА
      // =====================================================

      if (action.indexOf('access_allow_') === 0) {

        if (String(chatId) !== String(OWNER_ID)) {

          sendMessage(
            chatId,
            '⛔ <b>Недостаточно прав.</b>'
          );

          return HtmlService.createHtmlOutput('OK');
        }

        const userId =
          action.replace('access_allow_', '');

        const requestProperty =
          props.getProperty(
            'ACCESS_REQUEST_' + userId
          );

        if (!requestProperty) {

          sendMessage(
            chatId,
            '❌ <b>Заявка не найдена или уже обработана.</b>'
          );

          return HtmlService.createHtmlOutput('OK');
        }

        let requestData;

        try {

          requestData =
            JSON.parse(requestProperty);

        } catch (error) {

          sendMessage(
            chatId,
            '❌ Не удалось прочитать заявку.'
          );

          return HtmlService.createHtmlOutput('OK');
        }


        saveUserInfo(
          userId,
          requestData.username || '',
          requestData.firstName || '',
          requestData.lastName || ''
        );


        sendMessage(
          chatId,
          '🔐 <b>Выберите роль пользователя</b>\n\n' +
          '👤 Имя: <b>' +
          escapeHtml(
            requestData.firstName || 'Не указано'
          ) +
          '</b>\n' +
          '🔗 Username: ' +
          (
            requestData.username
              ? '@' + escapeHtml(requestData.username)
              : 'не указан'
          ) +
          '\n\n' +
          'Выберите роль:',
          {
            inline_keyboard: [

              [
                {
                  text: '🛡 Администрация',
                  callback_data:
                    'access_role_admin_' + userId
                }
              ],

              [
                {
                  text: '👁 Активисты',
                  callback_data:
                    'access_role_activist_' + userId
                }
              ],

              [
                {
                  text: '❌ Отмена',
                  callback_data: 'users'
                }
              ]

            ]
          }
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ВЫБОР РОЛИ — АДМИНИСТРАЦИЯ
      // =====================================================

      if (
        action.indexOf('access_role_admin_') === 0
      ) {

        if (String(chatId) !== String(OWNER_ID)) {

          sendMessage(
            chatId,
            '⛔ <b>Недостаточно прав.</b>'
          );

          return HtmlService.createHtmlOutput('OK');
        }

        const userId =
          action.replace(
            'access_role_admin_',
            ''
          );

        const requestProperty =
          props.getProperty(
            'ACCESS_REQUEST_' + userId
          );

        if (!requestProperty) {

          sendMessage(
            chatId,
            '❌ <b>Заявка не найдена или уже обработана.</b>'
          );

          return HtmlService.createHtmlOutput('OK');
        }

        let requestData;

        try {

          requestData =
            JSON.parse(requestProperty);

        } catch (error) {

          requestData = {};

        }


        addAllowedUser(userId);


        saveUserInfo(
          userId,
          requestData.username || '',
          requestData.firstName || '',
          requestData.lastName || ''
        );


        setUserRole(
          userId,
          '🛡 Администрация'
        );


        setUserPermissions(
          userId,
          '🛡 Администрация',
          'manage_students'
        );


        props.deleteProperty(
          'ACCESS_REQUEST_' + userId
        );


        sendMessage(
          userId,
          '✅ <b>Доступ выдан!</b>\n\n' +
          'Ваша роль: <b>🛡 Администрация</b>\n\n' +
          'Вам доступна работа со студентами.\n\n' +
          'Отправьте /start'
        );


        sendMessage(
          chatId,
          '✅ <b>Доступ выдан!</b>\n\n' +
          '👤 Пользователь: <b>' +
          escapeHtml(
            requestData.firstName || 'Не указано'
          ) +
          '</b>\n' +
          '🔗 Username: ' +
          (
            requestData.username
              ? '@' + escapeHtml(requestData.username)
              : 'не указан'
          ) +
          '\n' +
          '🔐 Роль: <b>🛡 Администрация</b>\n' +
          '🛠 Права: <b>Работа со студентами</b>',
          {
            inline_keyboard: [
              [
                {
                  text: '👥 Пользователи',
                  callback_data: 'users'
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

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ВЫБОР РОЛИ — АКТИВИСТЫ
      // =====================================================

      if (
        action.indexOf('access_role_activist_') === 0
      ) {

        if (String(chatId) !== String(OWNER_ID)) {

          sendMessage(
            chatId,
            '⛔ <b>Недостаточно прав.</b>'
          );

          return HtmlService.createHtmlOutput('OK');
        }

        const userId =
          action.replace(
            'access_role_activist_',
            ''
          );

        const requestProperty =
          props.getProperty(
            'ACCESS_REQUEST_' + userId
          );

        if (!requestProperty) {

          sendMessage(
            chatId,
            '❌ <b>Заявка не найдена или уже обработана.</b>'
          );

          return HtmlService.createHtmlOutput('OK');
        }

        let requestData;

        try {

          requestData =
            JSON.parse(requestProperty);

        } catch (error) {

          requestData = {};

        }


        addAllowedUser(userId);


        saveUserInfo(
          userId,
          requestData.username || '',
          requestData.firstName || '',
          requestData.lastName || ''
        );


        setUserRole(
          userId,
          '👁 Активисты'
        );


        setUserPermissions(
          userId,
          '👁 Активисты',
          'view'
        );


        props.deleteProperty(
          'ACCESS_REQUEST_' + userId
        );


        sendMessage(
          userId,
          '✅ <b>Доступ выдан!</b>\n\n' +
          'Ваша роль: <b>👁 Активисты</b>\n\n' +
          'Вам доступен просмотр информации.\n\n' +
          'Отправьте /start'
        );


        sendMessage(
          chatId,
          '✅ <b>Доступ выдан!</b>\n\n' +
          '👤 Пользователь: <b>' +
          escapeHtml(
            requestData.firstName || 'Не указано'
          ) +
          '</b>\n' +
          '🔗 Username: ' +
          (
            requestData.username
              ? '@' + escapeHtml(requestData.username)
              : 'не указан'
          ) +
          '\n' +
          '🔐 Роль: <b>👁 Активисты</b>\n' +
          '👁 Права: <b>Просмотр</b>',
          {
            inline_keyboard: [
              [
                {
                  text: '👥 Пользователи',
                  callback_data: 'users'
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

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ОТКЛОНЕНИЕ ДОСТУПА
      // =====================================================

      if (action.indexOf('access_deny_') === 0) {

        if (String(chatId) !== String(OWNER_ID)) {

          sendMessage(
            chatId,
            '⛔ <b>Недостаточно прав.</b>'
          );

          return HtmlService.createHtmlOutput('OK');
        }

        const userId =
          action.replace(
            'access_deny_',
            ''
          );

        props.deleteProperty(
          'ACCESS_REQUEST_' + userId
        );

        sendMessage(
          userId,
          '❌ <b>В доступе отказано.</b>\n\n' +
          'Обратитесь к владельцу бота, если считаете, что это ошибка.'
        );

        sendMessage(
          chatId,
          '❌ <b>Заявка отклонена.</b>'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ПРОВЕРКА ДОСТУПА
      // =====================================================

      if (!isAllowed(chatId)) {

        sendMessage(
          chatId,
          '⛔ <b>Доступ запрещён.</b>\n\n' +
          'У вас пока нет доступа к этому боту.\n\n' +
          'Нажмите кнопку ниже, чтобы отправить заявку владельцу.',
          {
            inline_keyboard: [
              [
                {
                  text: '🔐 Запросить доступ',
                  callback_data: 'request_access'
                }
              ]
            ]
          }
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ГЛАВНОЕ МЕНЮ
      // =====================================================

      if (action === 'menu') {

        props.deleteProperty(
          'STATE_' + chatId
        );

        props.deleteProperty(
          'EDIT_' + chatId
        );

        props.deleteProperty(
          'MOVE_' + chatId
        );

        props.deleteProperty(
          'EVICT_' + chatId
        );

        showMainMenu(chatId);

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ПОЛЬЗОВАТЕЛИ
      // =====================================================

      if (action === 'users') {

        if (String(chatId) !== String(OWNER_ID)) {

          sendMessage(
            chatId,
            '⛔ <b>Недостаточно прав.</b>\n\n' +
            'Раздел «Пользователи» доступен только владельцу.',
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

          return HtmlService.createHtmlOutput('OK');
        }


        sendMessage(
          chatId,
          '👥 <b>УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ</b>\n\n' +
          'Здесь можно управлять доступом и ролями.',
          {
            inline_keyboard: [

              [
                {
                  text: '👤 Список пользователей',
                  callback_data: 'users_list'
                }
              ],

              [
                {
                  text: '📨 Заявки на доступ',
                  callback_data: 'users_add'
                }
              ],

              [
                {
                  text: '🔐 Изменить роль',
                  callback_data: 'users_role'
                }
              ],

              [
                {
                  text: '❌ Забрать доступ',
                  callback_data: 'users_remove'
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

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // СПИСОК ПОЛЬЗОВАТЕЛЕЙ
      // =====================================================

      if (action === 'users_list') {

        if (String(chatId) !== String(OWNER_ID)) {

          sendMessage(
            chatId,
            '⛔ <b>Недостаточно прав.</b>'
          );

          return HtmlService.createHtmlOutput('OK');
        }

        const users =
          getAllowedUsers();

        let message =
          '👥 <b>ПОЛЬЗОВАТЕЛИ С ДОСТУПОМ</b>\n\n';

        const keyboard = [];


        users.forEach(function(userId) {

          const id =
            String(userId);

          const infoProperty =
            props.getProperty(
              'USER_INFO_' + id
            );

          let info = {};

          if (infoProperty) {

            try {

              info =
                JSON.parse(infoProperty);

            } catch (error) {

              info = {};

            }

          }

          const name =
            [
              info.firstName || '',
              info.lastName || ''
            ]
              .filter(Boolean)
              .join(' ')
              ||
              'Имя не указано';

          const username =
            info.username
              ? '@' + info.username
              : 'Username не указан';


          if (id === String(OWNER_ID)) {

            message +=
              '👑 <b>Владелец</b>\n' +
              '👤 ' +
              escapeHtml(name) +
              '\n' +
              '🔗 ' +
              escapeHtml(username) +
              '\n\n';

            return;
          }


          const role =
            getUserRole(id);

          const permission =
            getUserPermission(id);

          message +=
            '👤 <b>' +
            escapeHtml(name) +
            '</b>\n' +
            '🔗 ' +
            escapeHtml(username) +
            '\n' +
            '🔐 Роль: <b>' +
            escapeHtml(role) +
            '</b>\n' +
            '🛡 Права: <b>' +
            escapeHtml(
              getPermissionName(permission)
            ) +
            '</b>\n\n';


          keyboard.push([
            {
              text: '🔐 ' + name,
              callback_data:
                'users_permissions_' + id
            }
          ]);

        });


        if (users.length === 1) {

          message +=
            'ℹ️ Других пользователей пока нет.';

        }


        keyboard.push([
          {
            text: '🔄 Обновить',
            callback_data: 'users_list'
          }
        ]);

        keyboard.push([
          {
            text: '⬅️ Назад',
            callback_data: 'users'
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

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ЗАЯВКИ НА ДОСТУП
      // =====================================================

      if (action === 'users_add') {

        if (String(chatId) !== String(OWNER_ID)) {

          sendMessage(
            chatId,
            '⛔ <b>Недостаточно прав.</b>'
          );

          return HtmlService.createHtmlOutput('OK');
        }

        const allProperties =
          props.getProperties();

        let requests = [];

        Object.keys(allProperties).forEach(
          function(key) {

            if (
              key.indexOf(
                'ACCESS_REQUEST_'
              ) !== 0
            ) {

              return;
            }

            try {

              const data =
                JSON.parse(
                  allProperties[key]
                );

              requests.push(data);

            } catch (error) {}

          }
        );


        if (requests.length === 0) {

          sendMessage(
            chatId,
            '📨 <b>Заявок на доступ нет.</b>',
            {
              inline_keyboard: [
                [
                  {
                    text: '⬅️ Назад',
                    callback_data: 'users'
                  }
                ]
              ]
            }
          );

          return HtmlService.createHtmlOutput('OK');
        }


        let message =
          '📨 <b>ЗАЯВКИ НА ДОСТУП</b>\n\n';

        const keyboard = [];


        requests.forEach(
          function(request) {

            const userId =
              String(request.chatId);

            const name =
              request.firstName ||
              'Имя не указано';

            const username =
              request.username
                ? '@' + request.username
                : 'не указан';

            message +=
              '👤 <b>' +
              escapeHtml(name) +
              '</b>\n' +
              '🔗 ' +
              escapeHtml(username) +
              '\n\n';


            keyboard.push([
              {
                text: '✅ Разрешить — ' + name,
                callback_data:
                  'access_allow_' + userId
              }
            ]);

            keyboard.push([
              {
                text: '❌ Отклонить — ' + name,
                callback_data:
                  'access_deny_' + userId
              }
            ]);

          }
        );


        keyboard.push([
          {
            text: '⬅️ Назад',
            callback_data: 'users'
          }
        ]);


        sendMessage(
          chatId,
          message,
          {
            inline_keyboard: keyboard
          }
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ВЫБОР ПОЛЬЗОВАТЕЛЯ ДЛЯ ИЗМЕНЕНИЯ РОЛИ
      // =====================================================

      if (action === 'users_role') {

        if (String(chatId) !== String(OWNER_ID)) {

          sendMessage(
            chatId,
            '⛔ <b>Недостаточно прав.</b>'
          );

          return HtmlService.createHtmlOutput('OK');
        }

        const users =
          getAllowedUsers();

        const keyboard = [];

        users.forEach(function(userId) {

          const id =
            String(userId);

          if (id === String(OWNER_ID)) {
            return;
          }

          const infoProperty =
            props.getProperty(
              'USER_INFO_' + id
            );

          let info = {};

          if (infoProperty) {

            try {
              info =
                JSON.parse(infoProperty);
            } catch (error) {
              info = {};
            }

          }

          const name =
            [
              info.firstName || '',
              info.lastName || ''
            ]
              .filter(Boolean)
              .join(' ')
              ||
              'Пользователь';


          keyboard.push([
            {
              text: '🔐 ' + name,
              callback_data:
                'users_role_select_' + id
            }
          ]);

        });


        keyboard.push([
          {
            text: '⬅️ Назад',
            callback_data: 'users'
          }
        ]);


        sendMessage(
          chatId,
          '🔐 <b>ИЗМЕНЕНИЕ РОЛИ</b>\n\n' +
          'Выберите пользователя:',
          {
            inline_keyboard: keyboard
          }
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ВЫБОР ПОЛЬЗОВАТЕЛЯ ДЛЯ ИЗМЕНЕНИЯ РОЛИ
      // =====================================================

      if (
        action.indexOf('users_role_select_') === 0
      ) {

        if (String(chatId) !== String(OWNER_ID)) {

          sendMessage(
            chatId,
            '⛔ <b>Недостаточно прав.</b>'
          );

          return HtmlService.createHtmlOutput('OK');
        }

        const userId =
          action.replace(
            'users_role_select_',
            ''
          );

        if (
          String(userId) ===
          String(OWNER_ID)
        ) {

          sendMessage(
            chatId,
            '👑 <b>Роль владельца изменить нельзя.</b>'
          );

          return HtmlService.createHtmlOutput('OK');
        }


        const role =
          getUserRole(userId);

        const permission =
          getUserPermission(userId);


        sendMessage(
          chatId,
          '👤 <b>ПОЛЬЗОВАТЕЛЬ</b>\n\n' +
          '🔐 Текущая роль: <b>' +
          escapeHtml(role) +
          '</b>\n' +
          '🛡 Права: <b>' +
          escapeHtml(
            getPermissionName(permission)
          ) +
          '</b>\n\n' +
          'Выберите новую роль:',
          {
            inline_keyboard: [

              [
                {
                  text: '🛡 Администрация',
                  callback_data:
                    'change_role_admin_' + userId
                }
              ],

              [
                {
                  text: '👁 Активисты',
                  callback_data:
                    'change_role_activist_' + userId
                }
              ],

              [
                {
                  text: '⬅️ Назад',
                  callback_data: 'users_role'
                }

              ]

            ]
          }
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ИЗМЕНЕНИЕ РОЛИ — АДМИНИСТРАЦИЯ
      // =====================================================

      if (
        action.indexOf('change_role_admin_') === 0
      ) {

        if (String(chatId) !== String(OWNER_ID)) {

          sendMessage(
            chatId,
            '⛔ <b>Недостаточно прав.</b>'
          );

          return HtmlService.createHtmlOutput('OK');
        }

        const userId =
          action.replace(
            'change_role_admin_',
            ''
          );

        if (
          String(userId) ===
          String(OWNER_ID)
        ) {

          sendMessage(
            chatId,
            '👑 <b>Роль владельца изменить нельзя.</b>'
          );

          return HtmlService.createHtmlOutput('OK');
        }

        setUserRole(
          userId,
          '🛡 Администрация'
        );

        setUserPermissions(
          userId,
          '🛡 Администрация',
          'manage_students'
        );

        sendMessage(
          chatId,
          '✅ <b>Роль изменена.</b>\n\n' +
          '🔐 Новая роль: <b>🛡 Администрация</b>\n' +
          '🛠 Права: <b>Работа со студентами</b>',
          {
            inline_keyboard: [
              [
                {
                  text: '👥 Пользователи',
                  callback_data: 'users'
                }
              ]
            ]
          }
        );

        sendMessage(
          userId,
          '🔐 <b>Ваша роль изменена.</b>\n\n' +
          'Новая роль: <b>🛡 Администрация</b>\n' +
          'Права: <b>Работа со студентами</b>'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ИЗМЕНЕНИЕ РОЛИ — АКТИВИСТЫ
      // =====================================================

      if (
        action.indexOf('change_role_activist_') === 0
      ) {

        if (String(chatId) !== String(OWNER_ID)) {

          sendMessage(
            chatId,
            '⛔ <b>Недостаточно прав.</b>'
          );

          return HtmlService.createHtmlOutput('OK');
        }

        const userId =
          action.replace(
            'change_role_activist_',
            ''
          );

        if (
          String(userId) ===
          String(OWNER_ID)
        ) {

          sendMessage(
            chatId,
            '👑 <b>Роль владельца изменить нельзя.</b>'
          );

          return HtmlService.createHtmlOutput('OK');
        }

        setUserRole(
          userId,
          '👁 Активисты'
        );

        setUserPermissions(
          userId,
          '👁 Активисты',
          'view'
        );

        sendMessage(
          chatId,
          '✅ <b>Роль изменена.</b>\n\n' +
          '🔐 Новая роль: <b>👁 Активисты</b>\n' +
          '👁 Права: <b>Просмотр</b>',
          {
            inline_keyboard: [
              [
                {
                  text: '👥 Пользователи',
                  callback_data: 'users'
                }
              ]
            ]
          }
        );

        sendMessage(
          userId,
          '🔐 <b>Ваша роль изменена.</b>\n\n' +
          'Новая роль: <b>👁 Активисты</b>\n' +
          'Права: <b>Просмотр</b>'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ЗАБРАТЬ ДОСТУП
      // =====================================================

      if (action === 'users_remove') {

        if (String(chatId) !== String(OWNER_ID)) {

          sendMessage(
            chatId,
            '⛔ <b>Недостаточно прав.</b>'
          );

          return HtmlService.createHtmlOutput('OK');
        }

        const users =
          getAllowedUsers();

        const keyboard = [];


        users.forEach(function(userId) {

          const id =
            String(userId);

          if (id === String(OWNER_ID)) {
            return;
          }

          const infoProperty =
            props.getProperty(
              'USER_INFO_' + id
            );

          let info = {};

          if (infoProperty) {

            try {
              info =
                JSON.parse(infoProperty);
            } catch (error) {
              info = {};
            }

          }

          const name =
            [
              info.firstName || '',
              info.lastName || ''
            ]
              .filter(Boolean)
              .join(' ')
              ||
              'Пользователь';


          keyboard.push([
            {
              text: '❌ Забрать доступ — ' + name,
              callback_data:
                'users_remove_' + id
            }
          ]);

        });


        keyboard.push([
          {
            text: '⬅️ Назад',
            callback_data: 'users'
          }
        ]);


        sendMessage(
          chatId,
          '❌ <b>ЗАБРАТЬ ДОСТУП</b>\n\n' +
          'Выберите пользователя:',
          {
            inline_keyboard: keyboard
          }
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ ДОСТУПА
      // =====================================================

      if (
        action.indexOf('users_remove_') === 0
      ) {

        if (String(chatId) !== String(OWNER_ID)) {

          sendMessage(
            chatId,
            '⛔ <b>Недостаточно прав.</b>'
          );

          return HtmlService.createHtmlOutput('OK');
        }

        const userId =
          action.replace(
            'users_remove_',
            ''
          );

        if (
          String(userId) ===
          String(OWNER_ID)
        ) {

          sendMessage(
            chatId,
            '👑 <b>Владельца удалить нельзя.</b>'
          );

          return HtmlService.createHtmlOutput('OK');
        }

        removeAllowedUser(userId);


        sendMessage(
          userId,
          '❌ <b>Доступ к боту отозван.</b>\n\n' +
          'Если доступ нужен снова, отправьте /start.'
        );

        sendMessage(
          chatId,
          '✅ <b>Доступ пользователя отозван.</b>',
          {
            inline_keyboard: [
              [
                {
                  text: '👥 Пользователи',
                  callback_data: 'users'
                }
              ]
            ]
          }
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ПРАВА ПОЛЬЗОВАТЕЛЯ
      // =====================================================

      if (
        action.indexOf('users_permissions_') === 0
      ) {

        if (String(chatId) !== String(OWNER_ID)) {

          sendMessage(
            chatId,
            '⛔ <b>Недостаточно прав.</b>'
          );

          return HtmlService.createHtmlOutput('OK');
        }

        const userId =
          action.replace(
            'users_permissions_',
            ''
          );

        if (
          String(userId) ===
          String(OWNER_ID)
        ) {

          sendMessage(
            chatId,
            '👑 <b>У владельца полный доступ.</b>'
          );

          return HtmlService.createHtmlOutput('OK');
        }

        const role =
          getUserRole(userId);

        const permission =
          getUserPermission(userId);


        sendMessage(
          chatId,
          '👤 <b>ПОЛЬЗОВАТЕЛЬ</b>\n\n' +
          '🔐 Роль: <b>' +
          escapeHtml(role) +
          '</b>\n' +
          '🛡 Права: <b>' +
          escapeHtml(
            getPermissionName(permission)
          ) +
          '</b>\n\n' +
          'Выберите действие:',
          {
            inline_keyboard: [

              [
                {
                  text: '🛡 Администрация',
                  callback_data:
                    'change_role_admin_' + userId
                }
              ],

              [
                {
                  text: '👁 Активисты',
                  callback_data:
                    'change_role_activist_' + userId
                }
              ],

              [
                {
                  text: '❌ Забрать доступ',
                  callback_data:
                    'users_remove_' + userId
                }
              ],

              [
                {
                  text: '⬅️ Назад',
                  callback_data: 'users_list'
                }
              ]

            ]
          }
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ДОБАВИТЬ СТУДЕНТА
      // =====================================================

      if (action === 'add_student') {

        if (!hasPermission(chatId, 'manage_students')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        props.setProperty(
          'STATE_' + chatId,
          JSON.stringify({
            step: 'fio',
            data: {}
          })
        );

        sendMessage(
          chatId,
          '➕ <b>Добавление студента</b>\n\n' +
          'Введите ФИО студента:'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // НАЙТИ СТУДЕНТА
      // =====================================================

      if (action === 'find_student') {

        if (!hasPermission(chatId, 'view')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        props.setProperty(
          'STATE_' + chatId,
          JSON.stringify({
            step: 'find_manual'
          })
        );

        sendMessage(
          chatId,
          '🔎 <b>Поиск студента</b>\n\n' +
          'Введите ФИО или ИИН/паспорт:'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // СТАТИСТИКА
      // =====================================================

      if (action === 'statistics') {

        if (!hasPermission(chatId, 'view')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        showStatistics(chatId);

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ЖУРНАЛ
      // =====================================================

      if (action === 'journal') {

        if (!hasPermission(chatId, 'view')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        showJournal(chatId);

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // РУЧНОЙ ПОИСК
      // =====================================================

      if (action === 'find_manual') {

        if (!hasPermission(chatId, 'view')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        props.setProperty(
          'STATE_' + chatId,
          JSON.stringify({
            step: 'find_manual'
          })
        );

        sendMessage(
          chatId,
          '🔎 <b>Ручной поиск</b>\n\n' +
          'Введите ФИО или ИИН/паспорт:'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // СПИСОК КОМНАТ ДЛЯ ПОИСКА
      // =====================================================

      if (action === 'find_rooms') {

        if (!hasPermission(chatId, 'view')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        showFindRooms(
          chatId,
          1
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ПОИСК — ПЕРЕКЛЮЧЕНИЕ СТРАНИЦ КОМНАТ
      // =====================================================

      if (
        action.indexOf('find_rooms_page_') === 0
      ) {

        if (!hasPermission(chatId, 'view')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        const page =
          Number(
            action.replace(
              'find_rooms_page_',
              ''
            )
          );

        showFindRooms(
          chatId,
          page
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ПОИСК — КНОПКА НОМЕРА СТРАНИЦЫ
      // =====================================================

      if (action === 'find_rooms_noop') {

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ВЫБОР КОМНАТЫ ПРИ ПОИСКЕ
      // =====================================================

      if (
        action.indexOf('find_select_room_') === 0
      ) {

        if (!hasPermission(chatId, 'view')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        const room =
          action.replace(
            'find_select_room_',
            ''
          );

        showFindStudents(
          chatId,
          room
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ВЫБОР СТУДЕНТА ПРИ ПОИСКЕ
      // =====================================================

      if (
        action.indexOf('find_select_student_') === 0
      ) {

        if (!hasPermission(chatId, 'view')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        const rowNumber =
          Number(
            action.replace(
              'find_select_student_',
              ''
            )
          );

        showStudentByRow(
          chatId,
          rowNumber
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // РЕДАКТИРОВАНИЕ — ПЕРЕКЛЮЧЕНИЕ СТРАНИЦ КОМНАТ
      // =====================================================

      if (
        action.indexOf('edit_rooms_page_') === 0
      ) {

        if (!hasPermission(chatId, 'manage_students')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        const page =
          Number(
            action.replace(
              'edit_rooms_page_',
              ''
            )
          );

        showEditRooms(
          chatId,
          page
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // РЕДАКТИРОВАНИЕ — КНОПКА НОМЕРА СТРАНИЦЫ
      // =====================================================

      if (action === 'edit_rooms_noop') {

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // РЕДАКТИРОВАТЬ
      // =====================================================

      if (action === 'edit_student') {

        if (!hasPermission(chatId, 'manage_students')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        props.deleteProperty(
          'EDIT_' + chatId
        );

        props.setProperty(
          'STATE_' + chatId,
          JSON.stringify({
            step: 'edit_find'
          })
        );

        sendMessage(
          chatId,
          '✏️ <b>Редактирование студента</b>\n\n' +
          'Введите ФИО или ИИН/паспорт:'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // РУЧНОЙ ПОИСК ДЛЯ РЕДАКТИРОВАНИЯ
      // =====================================================

      if (action === 'edit_manual') {

        if (!hasPermission(chatId, 'manage_students')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        props.setProperty(
          'STATE_' + chatId,
          JSON.stringify({
            step: 'edit_find'
          })
        );

        sendMessage(
          chatId,
          '🔎 <b>Ручной поиск</b>\n\n' +
          'Введите ФИО или ИИН/паспорт:'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ВЫБОР КОМНАТЫ ПРИ РЕДАКТИРОВАНИИ
      // =====================================================

      if (
        action.indexOf('edit_select_room_') === 0
      ) {

        if (!hasPermission(chatId, 'manage_students')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        const room =
          action.replace(
            'edit_select_room_',
            ''
          );

        showEditStudents(
          chatId,
          room
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ВЫБОР СТУДЕНТА ПРИ РЕДАКТИРОВАНИИ
      // =====================================================

      if (
        action.indexOf('edit_select_student_') === 0
      ) {

        if (!hasPermission(chatId, 'manage_students')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        const rowNumber =
          Number(
            action.replace(
              'edit_select_student_',
              ''
            )
          );

        openEditStudent(
          chatId,
          rowNumber
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // РЕДАКТИРОВАНИЕ ФИО
      // =====================================================

      if (action === 'edit_fio') {

        if (!hasPermission(chatId, 'manage_students')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        props.setProperty(
          'STATE_' + chatId,
          JSON.stringify({
            step: 'edit_value',
            field: 'fio'
          })
        );

        sendMessage(
          chatId,
          '👤 Введите новое ФИО:'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // РЕДАКТИРОВАНИЕ ДАТЫ ЗАСЕЛЕНИЯ
      // =====================================================

      if (action === 'edit_dateIn') {

        if (!hasPermission(chatId, 'manage_students')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        props.setProperty(
          'STATE_' + chatId,
          JSON.stringify({
            step: 'edit_value',
            field: 'dateIn'
          })
        );

        sendMessage(
          chatId,
          '📅 Введите новую дату заселения:\n\n' +
          'Например: <code>01.09.2026</code>'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // РЕДАКТИРОВАНИЕ ДАТЫ РОЖДЕНИЯ
      // =====================================================

      if (action === 'edit_birthDate') {

        if (!hasPermission(chatId, 'manage_students')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        props.setProperty(
          'STATE_' + chatId,
          JSON.stringify({
            step: 'edit_value',
            field: 'birthDate'
          })
        );

        sendMessage(
          chatId,
          '🎂 Введите новую дату рождения:\n\n' +
          'Например: <code>15.03.2007</code>'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // РЕДАКТИРОВАНИЕ ИИН
      // =====================================================

      if (action === 'edit_iin') {

        if (!hasPermission(chatId, 'manage_students')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        props.setProperty(
          'STATE_' + chatId,
          JSON.stringify({
            step: 'edit_value',
            field: 'iin'
          })
        );

        sendMessage(
          chatId,
          '🪪 Введите новый ИИН / паспорт:'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // РЕДАКТИРОВАНИЕ ФАКУЛЬТЕТА
      // =====================================================

      if (action === 'edit_faculty') {

        if (!hasPermission(chatId, 'manage_students')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        props.setProperty(
          'STATE_' + chatId,
          JSON.stringify({
            step: 'edit_value',
            field: 'faculty'
          })
        );

        sendMessage(
          chatId,
          '🎓 Введите новый факультет:'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // РЕДАКТИРОВАНИЕ КОМНАТЫ
      // =====================================================

      if (action === 'edit_room') {

        if (!hasPermission(chatId, 'manage_students')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        props.setProperty(
          'STATE_' + chatId,
          JSON.stringify({
            step: 'edit_value',
            field: 'room'
          })
        );

        sendMessage(
          chatId,
          '🏠 Введите новый номер комнаты:'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // РЕДАКТИРОВАНИЕ ПРОПИСКИ
      // =====================================================

      if (action === 'edit_registration') {

        if (!hasPermission(chatId, 'manage_students')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        props.setProperty(
          'STATE_' + chatId,
          JSON.stringify({
            step: 'edit_value',
            field: 'registration'
          })
        );

        sendMessage(
          chatId,
          '📍 Введите новую прописку:'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // РЕДАКТИРОВАНИЕ ОПЛАТЫ
      // =====================================================

      if (action === 'edit_payment') {

        if (!hasPermission(chatId, 'manage_students')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        sendMessage(
          chatId,
          '💰 Выберите новый статус оплаты:',
          {
            inline_keyboard: [
              [
                {
                  text: '✅ Оплачено',
                  callback_data: 'edit_payment_paid'
                }
              ],
              [
                {
                  text: '❌ Без оплаты',
                  callback_data: 'edit_payment_not_paid'
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

        return HtmlService.createHtmlOutput('OK');
      }


      if (action === 'edit_payment_paid') {

        if (!hasPermission(chatId, 'manage_students')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        saveEditedStudent(
          chatId,
          'payment',
          'Оплачено'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      if (action === 'edit_payment_not_paid') {

        if (!hasPermission(chatId, 'manage_students')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        saveEditedStudent(
          chatId,
          'payment',
          'Без оплаты'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // КОМНАТЫ
      // =====================================================

      if (action === 'rooms') {

        if (!hasPermission(chatId, 'view')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        showRooms(chatId);

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ПЕРЕСЕЛЕНИЕ — ВЫБОР СТУДЕНТА
      // =====================================================

      if (action.indexOf('move_select_') === 0) {

        if (!hasPermission(chatId, 'manage_students')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        const rowNumber =
          Number(
            action.replace(
              'move_select_',
              ''
            )
          );

        if (!rowNumber || rowNumber < 2) {

          sendMessage(
            chatId,
            '❌ <b>Ошибка выбора студента.</b>',
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

          return HtmlService.createHtmlOutput('OK');
        }


        const sheet =
          SpreadsheetApp
            .openById(SS_ID)
            .getSheets()[0];


        const row =
          sheet
            .getRange(
              rowNumber,
              1,
              1,
              10
            )
            .getValues()[0];


        const fio =
          String(
            row[1] || ''
          ).trim();


        const oldRoom =
          String(
            row[6] || ''
          ).trim();


        const evictionDate =
          String(
            row[9] || ''
          ).trim();


        if (!fio) {

          sendMessage(
            chatId,
            '❌ <b>Студент не найден.</b>',
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

          return HtmlService.createHtmlOutput('OK');
        }


        if (evictionDate) {

          sendMessage(
            chatId,
            '❌ <b>Этот студент уже выселен.</b>',
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

          return HtmlService.createHtmlOutput('OK');
        }


        props.setProperty(
          'MOVE_' + chatId,
          JSON.stringify({
            rowNumber: rowNumber,
            fio: fio,
            oldRoom: oldRoom
          })
        );


        props.setProperty(
          'STATE_' + chatId,
          JSON.stringify({
            step: 'move_room'
          })
        );


        sendMessage(
          chatId,
          '🔄 <b>Переселение студента</b>\n\n' +
          '👤 ФИО: <b>' +
          escapeHtml(fio) +
          '</b>\n' +
          '🏠 Текущая комната: <b>' +
          escapeHtml(
            oldRoom || 'Не указана'
          ) +
          '</b>\n\n' +
          '🏠 <b>Введите новый номер комнаты:</b>\n\n' +
          'Например: <code>130</code>',
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


        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ПЕРЕСЕЛЕНИЕ
      // =====================================================

      if (action === 'move_student') {

        if (!hasPermission(chatId, 'manage_students')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        props.setProperty(
          'STATE_' + chatId,
          JSON.stringify({
            step: 'move_find'
          })
        );

        sendMessage(
          chatId,
          '🔄 <b>Переселение</b>\n\n' +
          'Введите ФИО, ИИН/паспорт или номер комнаты:'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ВЫСЕЛЕНИЕ
      // =====================================================

      if (action === 'evict_student') {

        if (!hasPermission(chatId, 'manage_students')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        props.setProperty(
          'STATE_' + chatId,
          JSON.stringify({
            step: 'evict_find'
          })
        );

        sendMessage(
          chatId,
          '📤 <b>Выселение</b>\n\n' +
          'Введите ФИО, ИИН/паспорт или номер комнаты:'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ПОДТВЕРЖДЕНИЕ ВЫСЕЛЕНИЯ
      // =====================================================

      if (action === 'confirm_evict') {

        if (!hasPermission(chatId, 'manage_students')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        const property =
          props.getProperty(
            'EVICT_' + chatId
          );

        if (!property) {

          sendMessage(
            chatId,
            '❌ Данные студента не найдены.',
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

          return HtmlService.createHtmlOutput('OK');
        }

        const evictData =
          JSON.parse(property);

        const sheet =
          SpreadsheetApp
            .openById(SS_ID)
            .getSheets()[0];

        const today =
          Utilities.formatDate(
            new Date(),
            Session.getScriptTimeZone(),
            'dd.MM.yyyy'
          );

        sheet
          .getRange(
            evictData.rowNumber,
            10
          )
          .setValue(today);

        sheet
          .getRange(
            evictData.rowNumber,
            1,
            1,
            10
          )
          .setBackground('#f4cccc');

        logAction(
          '📤 Выселение',
          evictData.fio,
          'Комната: ' + evictData.room
        );

        props.deleteProperty(
          'EVICT_' + chatId
        );

        sendMessage(
          chatId,
          '✅ <b>Студент выселен!</b>\n\n' +
          '👤 ФИО: <b>' +
          escapeHtml(evictData.fio) +
          '</b>\n' +
          '🏠 Комната: <b>' +
          escapeHtml(evictData.room) +
          '</b>\n' +
          '📅 Дата выселения: <b>' +
          today +
          '</b>',
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

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ОПЛАТА ПРИ ДОБАВЛЕНИИ
      // =====================================================

      if (action === 'payment_paid') {

        if (!hasPermission(chatId, 'manage_students')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        const stateProperty =
          props.getProperty(
            'STATE_' + chatId
          );

        if (!stateProperty) {

          sendMessage(
            chatId,
            '❌ Данные не найдены.'
          );

          return HtmlService.createHtmlOutput('OK');
        }

        const state =
          JSON.parse(stateProperty);

        state.data.payment =
          'Оплачено';

        saveStudent(
          chatId,
          state
        );

        return HtmlService.createHtmlOutput('OK');
      }


      if (action === 'payment_not_paid') {

        if (!hasPermission(chatId, 'manage_students')) {

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        const stateProperty =
          props.getProperty(
            'STATE_' + chatId
          );

        if (!stateProperty) {

          sendMessage(
            chatId,
            '❌ Данные не найдены.'
          );

          return HtmlService.createHtmlOutput('OK');
        }

        const state =
          JSON.parse(stateProperty);

        state.data.payment =
          'Без оплаты';

        saveStudent(
          chatId,
          state
        );

        return HtmlService.createHtmlOutput('OK');
      }

    }


    // =====================================================
    // ОБЫЧНЫЕ СООБЩЕНИЯ
    // =====================================================

    if (update.message) {

      const message =
        update.message;

      const chatId =
        message.chat.id;

      const text =
        String(
          message.text || ''
        ).trim();


      // =====================================================
      // СОХРАНЕНИЕ ДАННЫХ
      // =====================================================

      if (message.from) {

        saveUserInfo(
          chatId,
          message.from.username || '',
          message.from.first_name || '',
          message.from.last_name || ''
        );

      }


      // =====================================================
      // ПОЛЬЗОВАТЕЛЬ БЕЗ ДОСТУПА
      // =====================================================

      if (!isAllowed(chatId)) {

        sendMessage(
          chatId,
          '⛔ <b>Доступ запрещён.</b>\n\n' +
          'У вас пока нет доступа к этому боту.\n\n' +
          'Нажмите кнопку ниже, чтобы отправить заявку владельцу.',
          {
            inline_keyboard: [
              [
                {
                  text: '🔐 Запросить доступ',
                  callback_data: 'request_access'
                }
              ]
            ]
          }
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ПУСТОЕ СООБЩЕНИЕ
      // =====================================================

      if (!text) {

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // /start
      // =====================================================

      if (text === '/start') {

        props.deleteProperty(
          'STATE_' + chatId
        );

        props.deleteProperty(
          'EDIT_' + chatId
        );

        props.deleteProperty(
          'MOVE_' + chatId
        );

        props.deleteProperty(
          'EVICT_' + chatId
        );

        showMainMenu(chatId);

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // СОСТОЯНИЕ
      // =====================================================

      const stateProperty =
        props.getProperty(
          'STATE_' + chatId
        );


      if (!stateProperty) {

        sendMessage(
          chatId,
          'Выберите действие в главном меню:',
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

        return HtmlService.createHtmlOutput('OK');
      }


      const state =
        JSON.parse(stateProperty);


      // =====================================================
      // ДОБАВЛЕНИЕ — ФИО
      // =====================================================

      if (state.step === 'fio') {

        if (!hasPermission(chatId, 'manage_students')) {

          props.deleteProperty(
            'STATE_' + chatId
          );

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        state.data.fio =
          text;

        state.step =
          'dateIn';

        props.setProperty(
          'STATE_' + chatId,
          JSON.stringify(state)
        );

        sendMessage(
          chatId,
          '📅 Введите дату заселения:\n\n' +
          'Например: <code>01.09.2026</code>'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ДОБАВЛЕНИЕ — ДАТА ЗАСЕЛЕНИЯ
      // =====================================================

      if (state.step === 'dateIn') {

        if (!hasPermission(chatId, 'manage_students')) {

          props.deleteProperty(
            'STATE_' + chatId
          );

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        state.data.dateIn =
          text;

        state.step =
          'birthDate';

        props.setProperty(
          'STATE_' + chatId,
          JSON.stringify(state)
        );

        sendMessage(
          chatId,
          '🎂 Введите дату рождения:\n\n' +
          'Например: <code>15.03.2007</code>'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ДОБАВЛЕНИЕ — ДАТА РОЖДЕНИЯ
      // =====================================================

      if (state.step === 'birthDate') {

        if (!hasPermission(chatId, 'manage_students')) {

          props.deleteProperty(
            'STATE_' + chatId
          );

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        state.data.birthDate =
          text;

        state.step =
          'iin';

        props.setProperty(
          'STATE_' + chatId,
          JSON.stringify(state)
        );

        sendMessage(
          chatId,
          '🪪 Введите ИИН или номер паспорта:'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ДОБАВЛЕНИЕ — ИИН
      // =====================================================

      if (state.step === 'iin') {

        if (!hasPermission(chatId, 'manage_students')) {

          props.deleteProperty(
            'STATE_' + chatId
          );

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        state.data.iin =
          text;

        state.step =
          'faculty';

        props.setProperty(
          'STATE_' + chatId,
          JSON.stringify(state)
        );

        sendMessage(
          chatId,
          '🎓 Введите факультет:'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ДОБАВЛЕНИЕ — ФАКУЛЬТЕТ
      // =====================================================

      if (state.step === 'faculty') {

        if (!hasPermission(chatId, 'manage_students')) {

          props.deleteProperty(
            'STATE_' + chatId
          );

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        state.data.faculty =
          text;

        state.step =
          'room';

        props.setProperty(
          'STATE_' + chatId,
          JSON.stringify(state)
        );

        sendMessage(
          chatId,
          '🏠 Введите номер комнаты:'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ДОБАВЛЕНИЕ — КОМНАТА
      // =====================================================

      if (state.step === 'room') {

        if (!hasPermission(chatId, 'manage_students')) {

          props.deleteProperty(
            'STATE_' + chatId
          );

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        state.data.room =
          text;

        state.step =
          'registration';

        props.setProperty(
          'STATE_' + chatId,
          JSON.stringify(state)
        );

        sendMessage(
          chatId,
          '📍 Введите прописку:'
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ДОБАВЛЕНИЕ — ПРОПИСКА
      // =====================================================

      if (state.step === 'registration') {

        if (!hasPermission(chatId, 'manage_students')) {

          props.deleteProperty(
            'STATE_' + chatId
          );

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        state.data.registration =
          text;

        state.step =
          'payment';

        props.setProperty(
          'STATE_' + chatId,
          JSON.stringify(state)
        );

        sendMessage(
          chatId,
          '💰 Выберите статус оплаты:',
          {
            inline_keyboard: [
              [
                {
                  text: '✅ Оплачено',
                  callback_data: 'payment_paid'
                }
              ],
              [
                {
                  text: '❌ Без оплаты',
                  callback_data: 'payment_not_paid'
                }
              ]
            ]
          }
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // РУЧНОЙ ПОИСК
      // =====================================================

      if (state.step === 'find_manual') {

        if (!hasPermission(chatId, 'view')) {

          props.deleteProperty(
            'STATE_' + chatId
          );

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        props.deleteProperty(
          'STATE_' + chatId
        );

        findStudent(
          chatId,
          text
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // РУЧНОЙ ПОИСК ДЛЯ РЕДАКТИРОВАНИЯ
      // =====================================================

      if (state.step === 'edit_find') {

        if (!hasPermission(chatId, 'manage_students')) {

          props.deleteProperty(
            'STATE_' + chatId
          );

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        props.deleteProperty(
          'STATE_' + chatId
        );

        editStudent(
          chatId,
          text
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // СОХРАНЕНИЕ ИЗМЕНЕНИЙ
      // =====================================================

      if (state.step === 'edit_value') {

        if (!hasPermission(chatId, 'manage_students')) {

          props.deleteProperty(
            'STATE_' + chatId
          );

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        props.deleteProperty(
          'STATE_' + chatId
        );

        saveEditedStudent(
          chatId,
          state.field,
          text
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ПЕРЕСЕЛЕНИЕ — ПОИСК
      // =====================================================

      if (state.step === 'move_find') {

        if (!hasPermission(chatId, 'manage_students')) {

          props.deleteProperty(
            'STATE_' + chatId
          );

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        props.deleteProperty(
          'STATE_' + chatId
        );

        moveStudent(
          chatId,
          text
        );

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ПЕРЕСЕЛЕНИЕ — НОВАЯ КОМНАТА
      // =====================================================

      if (state.step === 'move_room') {

        if (!hasPermission(chatId, 'manage_students')) {

          props.deleteProperty(
            'STATE_' + chatId
          );

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        const property =
          props.getProperty(
            'MOVE_' + chatId
          );

        if (!property) {

          sendMessage(
            chatId,
            '❌ Данные о переселении не найдены.',
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

          return HtmlService.createHtmlOutput('OK');
        }

        const moveData =
          JSON.parse(property);

        const sheet =
          SpreadsheetApp
            .openById(SS_ID)
            .getSheets()[0];

        sheet
          .getRange(
            moveData.rowNumber,
            7
          )
          .setValue(text);

        logAction(
          '🔄 Переселение',
          moveData.fio,
          moveData.oldRoom + ' → ' + text
        );

        props.deleteProperty(
          'MOVE_' + chatId
        );

        props.deleteProperty(
          'STATE_' + chatId
        );

        sendMessage(
          chatId,
          '✅ <b>Студент успешно переселён!</b>\n\n' +
          '👤 ФИО: <b>' +
          escapeHtml(moveData.fio) +
          '</b>\n' +
          '🏠 Старая комната: <b>' +
          escapeHtml(moveData.oldRoom) +
          '</b>\n' +
          '🏠 Новая комната: <b>' +
          escapeHtml(text) +
          '</b>',
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

        return HtmlService.createHtmlOutput('OK');
      }


      // =====================================================
      // ВЫСЕЛЕНИЕ — ПОИСК
      // =====================================================

      if (state.step === 'evict_find') {

        if (!hasPermission(chatId, 'manage_students')) {

          props.deleteProperty(
            'STATE_' + chatId
          );

          sendNoPermission(chatId);

          return HtmlService.createHtmlOutput('OK');
        }

        props.deleteProperty(
          'STATE_' + chatId
        );

        evictStudent(
          chatId,
          text
        );

        return HtmlService.createHtmlOutput('OK');
      }

    }


    return HtmlService.createHtmlOutput('OK');


  } catch (error) {

    console.error(error);

    return HtmlService.createHtmlOutput('OK');
  }
}


/* =========================================================
   СИСТЕМА РОЛЕЙ И ПРАВ
   ========================================================= */

function removeUserRole(userId) {

  PropertiesService
    .getScriptProperties()
    .deleteProperty(
      'USER_ROLE_' + String(userId)
    );
}

function getAllRoomNumbers() {

  const rooms = [];

  for (let i = 1; i <= 162; i++) {
    rooms.push(String(i));
  }

  return rooms;
}

function removeUserPermissions(userId) {

  const id =
    String(userId);

  PropertiesService
    .getScriptProperties()
    .deleteProperty(
      'USER_ROLE_' + id
    );

  PropertiesService
    .getScriptProperties()
    .deleteProperty(
      'USER_PERMISSION_' + id
    );
}

function isAllowed(chatId) {

  const users =
    getAllowedUsers();

  return users.includes(
    String(chatId)
  );
}

function removeAllowedUser(chatId) {

  const users =
    getAllowedUsers();

  const id =
    String(chatId);

  const filtered =
    users.filter(function(userId) {

      return userId !== id &&
             userId !== String(OWNER_ID);

    });

  saveAllowedUsers(filtered);
}

function showFindStudents(chatId, room) {

  const sheet =
    SpreadsheetApp
      .openById(SS_ID)
      .getSheets()[0];

  const data =
    sheet.getDataRange().getValues();

  const students = [];

  for (let i = 1; i < data.length; i++) {

    const row = data[i];

    const rowRoom =
      String(row[6] || '').trim();

    const evictionDate =
      row[9] || '';

    if (evictionDate) {
      continue;
    }

    if (rowRoom === String(room)) {

      students.push({
        rowNumber: i + 1,
        fio: row[1] || ''
      });
    }
  }

  if (students.length === 0) {

    sendMessage(
      chatId,
      '❌ В комнате <b>' +
      escapeHtml(room) +
      '</b> нет проживающих студентов.',
      {
        inline_keyboard: [
          [
            {
              text: '⬅️ К комнатам',
              callback_data: 'find_rooms'
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

  const keyboard = [];

  for (let i = 0; i < students.length; i++) {

    keyboard.push([
      {
        text: '👤 ' + students[i].fio,
        callback_data:
          'find_select_student_' +
          students[i].rowNumber
      }
    ]);
  }

  keyboard.push([
    {
      text: '⬅️ К комнатам',
      callback_data: 'find_rooms'
    }
  ]);

  keyboard.push([
    {
      text: '🔍 Ввести ФИО / ИИН',
      callback_data: 'find_manual'
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
    '🚪 <b>Комната ' +
    escapeHtml(room) +
    '</b>\n\n' +
    'Выберите студента:',
    {
      inline_keyboard: keyboard
    }
  );
}
function showStudentByRow(chatId, rowNumber) {

  const sheet =
    SpreadsheetApp
      .openById(SS_ID)
      .getSheets()[0];

  const row =
    sheet
      .getRange(
        rowNumber,
        1,
        1,
        10
      )
      .getValues()[0];

  if (!row || !row[1]) {

    sendMessage(
      chatId,
      '❌ Студент не найден.',
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

  const evictionDate =
    row[9] || '';

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

  let message =
    '🔎 <b>Информация о студенте</b>\n\n' +

    '🔢 №: <b>' +
    escapeHtml(row[0]) +
    '</b>\n' +

    '👤 ФИО: <b>' +
    escapeHtml(row[1]) +
    '</b>\n' +

    '📅 Заселение: <b>' +
    escapeHtml(formatDate(row[2])) +
    '</b>\n' +

    '🎂 Дата рождения: <b>' +
    escapeHtml(formatDate(row[3])) +
    '</b>\n' +

    '🪪 ИИН/паспорт: <b>' +
    escapeHtml(row[4]) +
    '</b>\n' +

    '🎓 Факультет: <b>' +
    escapeHtml(row[5]) +
    '</b>\n' +

    '🏠 Комната: <b>' +
    escapeHtml(row[6]) +
    '</b>\n' +

    '📍 Прописка: <b>' +
    escapeHtml(row[7]) +
    '</b>\n' +

    '💰 Оплата: <b>' +
    escapeHtml(row[8]) +
    '</b>\n' +

    '🏠 <b>Статус: Проживает</b>';

  sendMessage(
    chatId,
    message,
    {
      inline_keyboard: [
        [
          {
            text: '⬅️ К поиску',
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

function showMainMenu(chatId) {

  const keyboard = {
    inline_keyboard: [

      [
        {
          text: '\uD83D\uDE80 \u041E\u0442\u043A\u0440\u044B\u0442\u044C Campus \u21161',
          web_app: {
            url: 'https://kesrea.github.io/campus1-miniapp/?v=11.1&cb=20261009b'
          }
        }
      ],

      [
        {
          text: '➕ Добавить студента',
          callback_data: 'add_student'
        }
      ],

      [
        {
          text: '🔎 Найти студента',
          callback_data: 'find_student'
        }
      ],

      [
        {
          text: '✏️ Редактировать',
          callback_data: 'edit_student'
        }
      ],

      [
        {
          text: '📊 Статистика',
          callback_data: 'statistics'
        }
      ],

      [
        {
          text: '👥 Пользователи',
          callback_data: 'users'
        }
      ],

      [
        {
          text: '🔄 Переселить',
          callback_data: 'move_student'
        },
        {
          text: '📤 Выселить',
          callback_data: 'evict_student'
        }
      ]

    ]
  };

  sendMessage(
    chatId,
    '🏠 <b>УПРАВЛЕНИЕ ОБЩЕЖИТИЕМ</b>\n\n' +
    'Выберите нужное действие:',
    keyboard
  );
}

function showStatistics(chatId) {

  const sheet = SpreadsheetApp
    .openById(SS_ID)
    .getSheets()[0];

  const data = sheet.getDataRange().getValues();

  let totalStudents = 0;
  let currentStudents = 0;
  let evictedStudents = 0;

  let paidStudents = 0;
  let unpaidStudents = 0;

  let movedInToday = 0;
  let evictedToday = 0;

  const occupiedRooms = {};

  const today = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'dd.MM.yyyy'
  );

  // Если студентов нет
  if (data.length <= 1) {

    sendMessage(
      chatId,
      '📊 <b>СТАТИСТИКА ОБЩЕЖИТИЯ</b>\n\n' +
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

  // Подсчёт студентов
  for (let i = 1; i < data.length; i++) {

    const row = data[i];

    const fio = String(row[1] || '').trim();

    if (!fio) {
      continue;
    }

    totalStudents++;

    const dateIn = normalizeStatisticsDateSimple(row[2]);
    const room = String(row[6] || '').trim();
    const payment = String(row[8] || '').trim();
    const evictionDate = normalizeStatisticsDateSimple(row[9]);

    // Выселен
    if (evictionDate) {

      evictedStudents++;

      if (evictionDate === today) {
        evictedToday++;
      }

      continue;
    }

    // Сейчас проживает
    currentStudents++;

    // Комната
    if (room) {
      occupiedRooms[room] = true;
    }

    // Оплата
    if (payment === 'Оплачено') {
      paidStudents++;
    }

    if (
      payment === 'Без оплаты' ||
      payment === 'Без оплаты'
    ) {
      unpaidStudents++;
    }

    // Заселён сегодня
    if (dateIn === today) {
      movedInToday++;
    }
  }

  const occupiedRoomCount =
    Object.keys(occupiedRooms).length;

  const message =
    '📊 <b>СТАТИСТИКА ОБЩЕЖИТИЯ</b>\n\n' +

    '👥 <b>Всего студентов:</b> ' +
    totalStudents + '\n' +

    '🏠 <b>Сейчас проживает:</b> ' +
    currentStudents + '\n' +

    '📤 <b>Выселено:</b> ' +
    evictedStudents + '\n\n' +

    '🚪 <b>Занято комнат:</b> ' +
    occupiedRoomCount + '\n\n' +

    '💰 <b>Оплачено:</b> ' +
    paidStudents + '\n' +

    '❌ <b>Не оплачено:</b> ' +
    unpaidStudents + '\n\n' +

    '📅 <b>Заселено сегодня:</b> ' +
    movedInToday + '\n' +

    '📤 <b>Выселено сегодня:</b> ' +
    evictedToday;

  sendMessage(
    chatId,
    message,
    {
      inline_keyboard: [
        [
          {
            text: '🔄 Обновить',
            callback_data: 'statistics'
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


// Обработка даты только для статистики
function normalizeStatisticsDateSimple(value) {

  if (!value) {
    return '';
  }

  if (
    Object.prototype.toString.call(value) ===
    '[object Date]'
  ) {

    if (isNaN(value.getTime())) {
      return '';
    }

    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone(),
      'dd.MM.yyyy'
    );
  }

  const text = String(value).trim();

  if (!text) {
    return '';
  }

  const match = text.match(
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})/
  );

  if (match) {

    return (
      ('0' + match[1]).slice(-2) +
      '.' +
      ('0' + match[2]).slice(-2) +
      '.' +
      match[3]
    );
  }

  return text;
}


// Нормализация даты для статистики
function normalizeStatisticsDate(value) {

  if (!value) {
    return '';
  }

  // Если Google Sheets вернул объект Date
  if (Object.prototype.toString.call(value) === '[object Date]') {

    if (isNaN(value.getTime())) {
      return '';
    }

    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone(),
      'dd.MM.yyyy'
    );
  }

  const text = String(value).trim();

  if (!text) {
    return '';
  }

  // Уже нормальный формат: 01.10.2026
  const match =
    text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);

  if (match) {

    const day =
      ('0' + match[1]).slice(-2);

    const month =
      ('0' + match[2]).slice(-2);

    const year =
      match[3];

    return day + '.' + month + '.' + year;
  }

  // Попытка обработать дату вида
  // Wed Oct 01 2026...
  const parsedDate = new Date(text);

  if (!isNaN(parsedDate.getTime())) {

    return Utilities.formatDate(
      parsedDate,
      Session.getScriptTimeZone(),
      'dd.MM.yyyy'
    );
  }

  return text;
}

// ===============================
// Добавление студента в таблицу
// ===============================

function addStudent(chatId, student) {

  const spreadsheet = SpreadsheetApp.openById(SS_ID);

  const sheet = spreadsheet.getSheets()[0];

  const lastRow = sheet.getLastRow();

  // Автоматический номер
  const number = lastRow;

  sheet.appendRow([
    number,
    student.fio,
    student.dateIn,
    student.birthDate,
    student.group,
    student.room,
    student.citizenship
  ]);

  sendMessage(
    chatId,
    '✅ Студент успешно добавлен!\n\n' +
    '👤 ФИО: ' + student.fio + '\n' +
    '📅 Заселение: ' + student.dateIn + '\n' +
    '🎂 Дата рождения: ' + student.birthDate + '\n' +
    '🎓 Группа: ' + student.group + '\n' +
    '🏠 Комната: ' + student.room + '\n' +
    '🌍 Гражданство: ' + student.citizenship
  );
}


// ===============================
// Отправка сообщения в Telegram
// ===============================


function formatDate(value) {
  if (!value) return '';

  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone(),
      'dd.MM.yyyy'
    );
  }

  return String(value);
}

function showRooms(chatId) {

  const sheet = SpreadsheetApp
    .openById(SS_ID)
    .getSheets()[0];

  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    sendMessage(
      chatId,
      '🏠 <b>КОМНАТЫ</b>\n\n' +
      '❌ В общежитии пока нет зарегистрированных студентов.',
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

  const rooms = {};

  for (let i = 1; i < data.length; i++) {

    const row = data[i];

    const fio = String(row[1] || '').trim();
    const room = String(row[6] || '').trim();
    const evictionDate = row[9] || '';

    if (!room || !fio) {
      continue;
    }

    if (evictionDate) {
      continue;
    }

    if (!rooms[room]) {
      rooms[room] = [];
    }

    rooms[room].push(fio);
  }

  const roomNumbers = Object.keys(rooms);

  if (roomNumbers.length === 0) {
    sendMessage(
      chatId,
      '🏠 <b>КОМНАТЫ</b>\n\n' +
      '❌ Сейчас нет занятых комнат.',
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

  roomNumbers.sort(function(a, b) {
    return Number(a) - Number(b);
  });

  let message = '🏠 <b>КОМНАТЫ</b>\n\n';

  for (let i = 0; i < roomNumbers.length; i++) {

    const room = roomNumbers[i];

    message +=
      '🚪 <b>Комната ' +
      escapeHtml(room) +
      '</b>\n';

    for (let j = 0; j < rooms[room].length; j++) {

      message +=
        '👤 ' +
        escapeHtml(rooms[room][j]) +
        '\n';
    }

    message += '\n';
  }

  sendMessage(
    chatId,
    message,
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

function autoCorrectTable() {

  const sheet = SpreadsheetApp
    .openById(SS_ID)
    .getSheets()[0];

  const lastRow = sheet.getLastRow();

  // Если кроме заголовка ничего нет
  if (lastRow <= 1) {
    return;
  }

  const numbers = [];

  // Нумерация начинается со строки 2
  for (let row = 2; row <= lastRow; row++) {
    numbers.push([row - 1]);
  }

  // Записываем номера в колонку A
  sheet
    .getRange(2, 1, numbers.length, 1)
    .setValues(numbers);
}

function autoCorrectTable() {

  const sheet = SpreadsheetApp
    .openById(SS_ID)
    .getSheets()[0];

  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return;
  }

  const numbers = [];

  for (let row = 2; row <= lastRow; row++) {
    numbers.push([row - 1]);
  }

  sheet
    .getRange(2, 1, numbers.length, 1)
    .setValues(numbers);
}

function onEdit(e) {
  autoCorrectTable();
}

function evictStudent(chatId, searchText) {

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

  const search = searchText
    .toString()
    .trim()
    .toLowerCase();

  const found = [];

  for (let i = 1; i < data.length; i++) {

    const row = data[i];

    const fio = String(row[1] || '').toLowerCase();
    const iin = String(row[4] || '').toLowerCase();
    const room = String(row[6] || '').toLowerCase();
    const evictionDate = row[9] || '';

    // Уже выселенных не показываем
    if (evictionDate) {
      continue;
    }

    if (
      fio.includes(search) ||
      iin.includes(search) ||
      room === search
    ) {
      found.push({
        rowNumber: i + 1,
        number: row[0] || '',
        fio: row[1] || '',
        birthDate: row[3] || '',
        iin: row[4] || '',
        faculty: row[5] || '',
        room: row[6] || ''
      });
    }
  }

  // Студент не найден
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
              text: '📤 Попробовать снова',
              callback_data: 'evict_student'
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

  // Найдено несколько
  if (found.length > 1) {

    let message =
      '📤 <b>Найдено несколько студентов</b>\n\n';

    for (let i = 0; i < found.length; i++) {

      message +=
        '👤 <b>' +
        escapeHtml(found[i].fio) +
        '</b>\n' +
        '🏠 Комната: ' +
        escapeHtml(found[i].room) +
        '\n\n';
    }

    message +=
      'Введите более точное ФИО или ИИН/паспорт.';

    sendMessage(
      chatId,
      message,
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

  const student = found[0];

  // Сохраняем студента для подтверждения
  PropertiesService
    .getScriptProperties()
    .setProperty(
      'EVICT_' + chatId,
      JSON.stringify({
        rowNumber: student.rowNumber,
        fio: student.fio,
        room: student.room
      })
    );

  sendMessage(
    chatId,
    '📤 <b>Выселение студента</b>\n\n' +
    '👤 ФИО: <b>' +
    escapeHtml(student.fio) +
    '</b>\n' +
    '🏠 Комната: <b>' +
    escapeHtml(student.room) +
    '</b>\n' +
    '🪪 ИИН/паспорт: <b>' +
    escapeHtml(student.iin) +
    '</b>\n' +
    '🎓 Факультет: <b>' +
    escapeHtml(student.faculty) +
    '</b>\n\n' +
    '❗ <b>Вы действительно хотите выселить этого студента?</b>',
    {
      inline_keyboard: [
        [
          {
            text: '✅ Да, выселить',
            callback_data: 'confirm_evict'
          },
          {
            text: '❌ Отмена',
            callback_data: 'menu'
          }
        ]
      ]
    }
  );
}

function saveEditedStudent(chatId, field, value) {

  const property =
    PropertiesService
      .getScriptProperties()
      .getProperty('EDIT_' + chatId);

  if (!property) {

    sendMessage(
      chatId,
      '❌ Данные студента не найдены.',
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

  const editData = JSON.parse(property);

  const sheet = SpreadsheetApp
    .openById(SS_ID)
    .getSheets()[0];

  const columnMap = {
    fio: 2,
    dateIn: 3,
    birthDate: 4,
    iin: 5,
    faculty: 6,
    room: 7,
    registration: 8,
    payment: 9
  };

  const column = columnMap[field];

  if (!column) {
    return;
  }

  sheet
    .getRange(editData.rowNumber, column)
    .setValue(value);

  PropertiesService
    .getScriptProperties()
    .deleteProperty('EDIT_' + chatId);

  const fieldNames = {
    fio: 'ФИО',
    dateIn: 'Дата заселения',
    birthDate: 'Дата рождения',
    iin: 'ИИН / паспорт',
    faculty: 'Факультет',
    room: 'Комната',
    registration: 'Прописка',
    payment: 'Оплата'
  };

  sendMessage(
    chatId,
    '✅ <b>Данные успешно изменены!</b>\n\n' +
    '👤 Студент: <b>' +
    escapeHtml(editData.fio) +
    '</b>\n' +
    '📝 Поле: <b>' +
    fieldNames[field] +
    '</b>\n' +
    '🔄 Новое значение: <b>' +
    escapeHtml(value) +
    '</b>',
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

function showEditRooms(chatId, page) {

  page = Number(page) || 1;

  const sheet =
    SpreadsheetApp
      .openById(SS_ID)
      .getSheets()[0];

  const data =
    sheet
      .getDataRange()
      .getValues();

  const rooms = {};

  // Собираем только комнаты, где есть проживающие
  for (let i = 1; i < data.length; i++) {

    const row = data[i];

    const fio =
      String(row[1] || '').trim();

    const room =
      String(row[6] || '').trim();

    const evictionDate =
      String(row[9] || '').trim();

    if (!fio || !room || evictionDate) {
      continue;
    }

    rooms[room] = true;
  }

  // Все комнаты 1–162
  const allRooms = [];

  for (let i = 1; i <= 162; i++) {
    allRooms.push(String(i));
  }

  const perPage = 20;

  const totalPages =
    Math.ceil(allRooms.length / perPage);

  if (page < 1) {
    page = 1;
  }

  if (page > totalPages) {
    page = totalPages;
  }

  const start =
    (page - 1) * perPage;

  const end =
    Math.min(
      start + perPage,
      allRooms.length
    );

  const keyboard = [];

  // По 4 комнаты в ряд
  for (let i = start; i < end; i += 4) {

    const row = [];

    for (
      let j = 0;
      j < 4 && i + j < end;
      j++
    ) {

      const room =
        allRooms[i + j];

      row.push({
        text:
          (rooms[room] ? '🟢 ' : '⚪ ') +
          room,

        callback_data:
          'edit_select_room_' + room
      });
    }

    keyboard.push(row);
  }

  // Навигация
  const navigation = [];

  if (page > 1) {

    navigation.push({
      text: '⬅️ Назад',
      callback_data:
        'edit_rooms_page_' + (page - 1)
    });
  }

  navigation.push({
    text:
      '📄 ' +
      page +
      '/' +
      totalPages,
    callback_data:
      'edit_rooms_noop'
  });

  if (page < totalPages) {

    navigation.push({
      text: 'Вперёд ➡️',
      callback_data:
        'edit_rooms_page_' + (page + 1)
    });
  }

  keyboard.push(navigation);

  keyboard.push([
    {
      text: '🏠 Главное меню',
      callback_data: 'menu'
    }
  ]);

  sendMessage(
    chatId,
    '✏️ <b>Выбор комнаты</b>\n\n' +
    '🟢 — комната занята\n' +
    '⚪ — свободна\n\n' +
    '📄 Страница ' +
    page +
    ' из ' +
    totalPages +
    '\n\n' +
    'Выберите комнату:',
    {
      inline_keyboard: keyboard
    }
  );
}

function showEditStudents(chatId, room) {

  const sheet = SpreadsheetApp
    .openById(SS_ID)
    .getSheets()[0];

  const data = sheet.getDataRange().getValues();

  const students = [];

  for (let i = 1; i < data.length; i++) {

    const row = data[i];

    const rowRoom = String(row[6] || '').trim();
    const evictionDate = row[9] || '';

    if (evictionDate) {
      continue;
    }

    if (rowRoom === String(room)) {

      students.push({
        rowNumber: i + 1,
        fio: row[1] || ''
      });
    }
  }

  if (students.length === 0) {

    sendMessage(
      chatId,
      '❌ В комнате <b>' +
      escapeHtml(room) +
      '</b> нет студентов.',
      {
        inline_keyboard: [
          [
            {
              text: '⬅️ К комнатам',
              callback_data: 'edit_student'
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

  const keyboard = [];

  for (let i = 0; i < students.length; i++) {

    keyboard.push([
      {
        text: '👤 ' + students[i].fio,
        callback_data:
          'edit_select_student_' +
          students[i].rowNumber
      }
    ]);
  }

  keyboard.push([
    {
      text: '⬅️ К комнатам',
      callback_data: 'edit_student'
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
    '🚪 <b>Комната ' +
    escapeHtml(room) +
    '</b>\n\n' +
    'Выберите студента:',
    {
      inline_keyboard: keyboard
    }
  );
}

function showFindRooms(chatId, page) {

  page = Number(page) || 1;


  const allRooms = [];

  for (let i = 1; i <= 162; i++) {
    allRooms.push(String(i));
  }


  const perPage = 20;

  const totalPages =
    Math.ceil(
      allRooms.length / perPage
    );


  if (page < 1) {
    page = 1;
  }

  if (page > totalPages) {
    page = totalPages;
  }


  const start =
    (page - 1) * perPage;

  const end =
    Math.min(
      start + perPage,
      allRooms.length
    );


  const keyboard = [];


  for (
    let i = start;
    i < end;
    i += 4
  ) {

    const row = [];

    for (
      let j = 0;
      j < 4 && i + j < end;
      j++
    ) {

      const room =
        allRooms[i + j];

      row.push({
        text: '🏠 ' + room,

        callback_data:
          'find_select_room_' + room
      });

    }

    keyboard.push(row);
  }


  const navigation = [];


  if (page > 1) {

    navigation.push({
      text: '⬅️ Назад',
      callback_data:
        'find_rooms_page_' + (page - 1)
    });

  }


  navigation.push({
    text:
      '📄 ' +
      page +
      '/' +
      totalPages,

    callback_data:
      'find_rooms_noop'
  });


  if (page < totalPages) {

    navigation.push({
      text: 'Вперёд ➡️',
      callback_data:
        'find_rooms_page_' + (page + 1)
    });

  }


  keyboard.push(navigation);


  keyboard.push([
    {
      text: '🔍 Ввести ФИО / ИИН',
      callback_data: 'find_manual'
    }
  ]);


  keyboard.push([
    {
      text: '⬅️ Назад',
      callback_data: 'find_student'
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

    '🏠 <b>Выбор комнаты</b>\n\n' +
    '📄 Страница ' +
    page +
    ' из ' +
    totalPages +
    '\n\n' +
    'Выберите комнату:',

    {
      inline_keyboard:
        keyboard
    }
  );
}

function showFindStudents(chatId, room) {

  const sheet =
    SpreadsheetApp
      .openById(SS_ID)
      .getSheets()[0];

  const data =
    sheet.getDataRange().getValues();

  const students = [];

  for (let i = 1; i < data.length; i++) {

    const row = data[i];

    const rowRoom =
      String(row[6] || '').trim();

    const evictionDate =
      row[9] || '';

    if (evictionDate) {
      continue;
    }

    if (rowRoom === String(room)) {

      students.push({
        rowNumber: i + 1,
        fio: row[1] || ''
      });
    }
  }

  if (students.length === 0) {

    sendMessage(
      chatId,
      '❌ В комнате <b>' +
      escapeHtml(room) +
      '</b> нет проживающих студентов.',
      {
        inline_keyboard: [
          [
            {
              text: '⬅️ К комнатам',
              callback_data: 'find_rooms'
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

  const keyboard = [];

  for (let i = 0; i < students.length; i++) {

    keyboard.push([
      {
        text: '👤 ' + students[i].fio,
        callback_data:
          'find_select_student_' +
          students[i].rowNumber
      }
    ]);
  }

  keyboard.push([
    {
      text: '⬅️ К комнатам',
      callback_data: 'find_rooms'
    }
  ]);

  keyboard.push([
    {
      text: '🔍 Ввести ФИО / ИИН',
      callback_data: 'find_manual'
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
    '🚪 <b>Комната ' +
    escapeHtml(room) +
    '</b>\n\n' +
    'Выберите студента:',
    {
      inline_keyboard: keyboard
    }
  );
}

function logAction(action, fio, details) {

  const spreadsheet =
    SpreadsheetApp.openById(SS_ID);

  let sheet =
    spreadsheet.getSheetByName('Журнал');

  // Если листа ещё нет — создаём
  if (!sheet) {

    sheet =
      spreadsheet.insertSheet('Журнал');

    sheet.appendRow([
      'Дата и время',
      'Действие',
      'ФИО',
      'Подробности'
    ]);

    sheet
      .getRange(1, 1, 1, 4)
      .setFontWeight('bold');
  }

  const dateTime =
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      'dd.MM.yyyy HH:mm'
    );

  sheet.appendRow([
    dateTime,
    action,
    fio,
    details
  ]);
}

function showInterface(chatId, text, keyboard) {

  const properties =
    PropertiesService.getScriptProperties();

  const key =
    'UI_MESSAGE_' + chatId;

  const savedMessageId =
    properties.getProperty(key);

  // Если интерфейсное сообщение уже существует —
  // пытаемся изменить его
  if (savedMessageId) {

    const url =
      'https://api.telegram.org/bot' +
      TOKEN +
      '/editMessageText';

    const payload = {
      chat_id: chatId,
      message_id: Number(savedMessageId),
      text: text,
      parse_mode: 'HTML',
      reply_markup: keyboard
    };

    const response =
      UrlFetchApp.fetch(
        url,
        {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        }
      );

    const result =
      JSON.parse(response.getContentText());

    if (result.ok) {
      return;
    }

    // Если сообщение больше нельзя изменить,
    // забываем его ID и создаём новое
    properties.deleteProperty(key);
  }

  // Интерфейсного сообщения ещё нет
  const url =
    'https://api.telegram.org/bot' +
    TOKEN +
    '/sendMessage';

  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: keyboard
  };

  const response =
    UrlFetchApp.fetch(
      url,
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );

  const result =
    JSON.parse(response.getContentText());

  if (
    result.ok &&
    result.result &&
    result.result.message_id
  ) {

    properties.setProperty(
      key,
      String(result.result.message_id)
    );
  }
}

function showUsersMenu(chatId) {

  sendMessage(
    chatId,
    '👥 <b>УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ</b>\n\n' +
    'Здесь можно управлять доступом к боту.',
    {
      inline_keyboard: [

        [
          {
            text: '👤 Список пользователей',
            callback_data: 'users_list'
          }
        ],

        [
          {
            text: '➕ Выдать доступ',
            callback_data: 'users_add'
          }
        ],

        [
          {
            text: '❌ Забрать доступ',
            callback_data: 'users_remove'
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

function getTelegramUserInfo(userId) {

  const url =
    'https://api.telegram.org/bot' +
    TOKEN +
    '/getChat';

  try {

    const response =
      UrlFetchApp.fetch(
        url,
        {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify({
            chat_id: String(userId)
          }),
          muteHttpExceptions: true
        }
      );

    const result =
      JSON.parse(
        response.getContentText()
      );

    if (
      result.ok &&
      result.result
    ) {

      return result.result;

    }

  } catch (error) {

    console.log(
      'Ошибка получения данных пользователя: ' +
      error
    );

  }

  return null;
}

function showUsersList(chatId) {

  if (
    String(chatId) !==
    String(OWNER_ID)
  ) {

    sendMessage(
      chatId,
      '⛔ <b>Недостаточно прав.</b>'
    );

    return;
  }

  const users =
    getAllowedUsers();

  let message =
    '👥 <b>ПОЛЬЗОВАТЕЛИ С ДОСТУПОМ</b>\n\n';

  if (!users || users.length === 0) {

    message +=
      '❌ Пользователей нет.';

  } else {

    users.forEach(function(userId) {

      const id =
        String(userId);

      const infoProperty =
        PropertiesService
          .getScriptProperties()
          .getProperty(
            'USER_INFO_' + id
          );

      let info = {};

      if (infoProperty) {

        try {

          info =
            JSON.parse(infoProperty);

        } catch (error) {

          info = {};

        }
      }

      const name =
        [
          info.firstName || '',
          info.lastName || ''
        ]
        .filter(Boolean)
        .join(' ') ||
        'Имя не указано';

      const username =
        info.username
          ? '@' + info.username
          : 'Username не указан';

      if (
        id ===
        String(OWNER_ID)
      ) {

        message +=
          '👑 <b>Владелец</b>\n' +
          '👤 Имя: <b>' +
          escapeHtml(name) +
          '</b>\n' +
          '🔗 Username: <b>' +
          escapeHtml(username) +
          '</b>\n' +
          '🆔 ID: <code>' +
          escapeHtml(id) +
          '</code>\n\n';

      } else {

        message +=
          '👤 <b>Пользователь</b>\n' +
          '👤 Имя: <b>' +
          escapeHtml(name) +
          '</b>\n' +
          '🔗 Username: <b>' +
          escapeHtml(username) +
          '</b>\n' +
          '🆔 ID: <code>' +
          escapeHtml(id) +
          '</code>\n\n';
      }

    });
  }

  sendMessage(
    chatId,
    message,
    {
      inline_keyboard: [
        [
          {
            text: '🔄 Обновить',
            callback_data: 'users_list'
          }
        ],
        [
          {
            text: '⬅️ Назад',
            callback_data: 'users'
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
