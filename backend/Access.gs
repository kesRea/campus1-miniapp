function getUserRole(userId) {

  const id =
    String(userId);

  if (
    id ===
    String(OWNER_ID)
  ) {

    return 'Владелец';

  }

  return (
    PropertiesService
      .getScriptProperties()
      .getProperty(
        'USER_ROLE_' + id
      ) ||
    'Без роли'
  );
}
function getUserPermission(userId) {

  const id =
    String(userId);

  if (
    id ===
    String(OWNER_ID)
  ) {

    return 'owner';

  }

  return (
    PropertiesService
      .getScriptProperties()
      .getProperty(
        'USER_PERMISSION_' + id
      ) ||
    'view'
  );
}
function getPermissionName(permission) {

  if (
    permission === 'owner'
  ) {

    return 'Полный доступ';

  }

  if (
    permission === 'manage_students'
  ) {

    return 'Работа со студентами';

  }

  return 'Просмотр';
}
function setUserRole(userId, role) {

  PropertiesService
    .getScriptProperties()
    .setProperty(
      'USER_ROLE_' + String(userId),
      String(role)
    );
}
function setUserPermissions(
  userId,
  role,
  permission
) {

  const id =
    String(userId);

  PropertiesService
    .getScriptProperties()
    .setProperty(
      'USER_ROLE_' + id,
      String(role)
    );

  PropertiesService
    .getScriptProperties()
    .setProperty(
      'USER_PERMISSION_' + id,
      String(permission)
    );
}
function hasPermission(
  chatId,
  requiredPermission
) {

  const id =
    String(chatId);

  if (
    id ===
    String(OWNER_ID)
  ) {

    return true;
  }

  const permission =
    getUserPermission(id);

  if (
    requiredPermission === 'view'
  ) {

    return (
      permission === 'view' ||
      permission === 'manage_students'
    );
  }

  if (
    requiredPermission === 'manage_students'
  ) {

    return (
      permission === 'manage_students'
    );
  }

  return false;
}
function sendNoPermission(chatId) {

  sendMessage(
    chatId,
    '⛔ <b>Недостаточно прав.</b>\n\n' +
    'Ваша роль: <b>' +
    escapeHtml(
      getUserRole(chatId)
    ) +
    '</b>\n' +
    'Уровень доступа: <b>' +
    escapeHtml(
      getPermissionName(
        getUserPermission(chatId)
      )
    ) +
    '</b>'
  );
}
function getAllowedUsers() {

  const props =
    PropertiesService.getScriptProperties();

  const saved =
    props.getProperty('ALLOWED_USERS');

  if (!saved) {

    return [
      String(OWNER_ID)
    ];
  }

  try {

    const users =
      JSON.parse(saved);

    if (!users.includes(String(OWNER_ID))) {
      users.push(String(OWNER_ID));
    }

    return users;

  } catch (error) {

    return [
      String(OWNER_ID)
    ];
  }
}
function addAllowedUser(chatId) {

  const users =
    getAllowedUsers();

  const id =
    String(chatId);

  if (!users.includes(id)) {

    users.push(id);

    saveAllowedUsers(users);
  }
}
function saveAllowedUsers(users) {

  PropertiesService
    .getScriptProperties()
    .setProperty(
      'ALLOWED_USERS',
      JSON.stringify(users)
    );
}
function saveUserInfo(chatId, username, firstName, lastName) {

  const id = String(chatId);

  const info = {
    id: id,
    username: username || '',
    firstName: firstName || '',
    lastName: lastName || ''
  };

  PropertiesService
    .getScriptProperties()
    .setProperty(
      'USER_INFO_' + id,
      JSON.stringify(info)
    );
}
function requestAccess(chatId, username, firstName) {

  const props =
    PropertiesService.getScriptProperties();

  const requestKey =
    'ACCESS_REQUEST_' + chatId;

  props.setProperty(
    requestKey,
    JSON.stringify({
      chatId: String(chatId),
      username: username || '',
      firstName: firstName || ''
    })
  );

  sendMessage(
    OWNER_ID,
    '🔐 <b>Новая заявка на доступ</b>\n\n' +

    '👤 Имя: <b>' +
    escapeHtml(firstName || 'Не указано') +
    '</b>\n' +

    '🆔 Telegram ID: <code>' +
    chatId +
    '</code>\n' +

    '🔗 Username: ' +
    (username
      ? '@' + escapeHtml(username)
      : 'не указан'),

    {
      inline_keyboard: [
        [
          {
            text: '✅ Разрешить',
            callback_data:
              'access_allow_' + chatId
          }
        ],
        [
          {
            text: '❌ Отклонить',
            callback_data:
              'access_deny_' + chatId
          }
        ]
      ]
    }
  );

  sendMessage(
    chatId,
    '📨 <b>Заявка отправлена владельцу.</b>\n\n' +
    'После подтверждения вы сможете пользоваться ботом.'
  );
}