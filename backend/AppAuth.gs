/* CAMPUS_BACKEND_AUTH_V13_11 */
function campusHmacSha256_(value, key) {
  var valueBytes = Array.isArray(value)
    ? value
    : Utilities.newBlob(String(value), 'text/plain').getBytes();

  var keyBytes = Array.isArray(key)
    ? key
    : Utilities.newBlob(String(key), 'text/plain').getBytes();

  return Utilities.computeHmacSha256Signature(valueBytes, keyBytes);
}

function validateTelegramInitData_(initData) {
  if (!initData) return { ok: false, error: 'Mini App открыт не через Telegram.' };
  if (typeof TOKEN === 'undefined' || !TOKEN) return { ok: false, error: 'TOKEN не настроен.' };

  var params = {};
  String(initData).split('&').forEach(function(part) {
    var idx = part.indexOf('=');
    var key = decodeURIComponent(idx >= 0 ? part.substring(0, idx) : part);
    var value = decodeURIComponent((idx >= 0 ? part.substring(idx + 1) : '').replace(/\+/g, '%20'));
    params[key] = value;
  });

  var receivedHash = params.hash || '';
  if (!receivedHash) return { ok: false, error: 'Telegram hash отсутствует.' };

  var authDate = Number(params.auth_date || 0);
  var now = Math.floor(Date.now() / 1000);
  if (!authDate || Math.abs(now - authDate) > CAMPUS_APP.telegramAuthMaxAgeSeconds) {
    return { ok: false, error: 'Сессия Telegram устарела. Откройте приложение заново.' };
  }

  var dataCheckString = Object.keys(params)
    .filter(function(key) { return key !== 'hash'; })
    .sort()
    .map(function(key) { return key + '=' + params[key]; })
    .join('\n');

  var tokenBytes = Utilities.newBlob(String(TOKEN), 'text/plain').getBytes();
  var webAppDataBytes = Utilities.newBlob('WebAppData', 'text/plain').getBytes();
  var dataCheckBytes = Utilities.newBlob(String(dataCheckString), 'text/plain').getBytes();

  var secretKey = Utilities.computeHmacSha256Signature(
    tokenBytes,
    webAppDataBytes
  );

  var signature = Utilities.computeHmacSha256Signature(
    dataCheckBytes,
    secretKey
  );

  var calculatedHash = signature.map(function(byte) {
    var v = (byte < 0 ? byte + 256 : byte).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');

  if (!constantTimeEquals_(calculatedHash, receivedHash)) {
    return { ok: false, error: 'Не удалось подтвердить данные Telegram. [HMAC-V2]' };
  }

  var user = null;
  try { user = params.user ? JSON.parse(params.user) : null; } catch (e) {}
  if (!user || !user.id) return { ok: false, error: 'Telegram user отсутствует.' };

  return { ok: true, user: user, authDate: authDate };
}

function constantTimeEquals_(a, b) {
  a = String(a || '');
  b = String(b || '');
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function getAppIdentity_(initData) {
  var verified = validateTelegramInitData_(initData);
  if (!verified.ok) throw new Error(verified.error);

  var id = String(verified.user.id);
  var owner = typeof OWNER_ID !== 'undefined' && id === String(OWNER_ID);
  var developer = typeof isCampusDeveloperId_ === 'function'
    ? isCampusDeveloperId_(id)
    : id === '7272434463';

  var allowed = owner || developer || (typeof isAllowed === 'function' && isAllowed(id));
  if (!allowed) throw new Error('У вас нет доступа к Campus №1. Запросите доступ через бота.');

  /* CAMPUS_AUTH_V14_REMEMBER_PHOTO */
  try {
    if (
      typeof saveUserInfo ===
      'function'
    ) {
      saveUserInfo(
        id,
        verified.user.username || '',
        verified.user.first_name || '',
        verified.user.last_name || '',
        verified.user.photo_url || ''
      );
    }
  } catch (e) {}

  var accessRole = owner ? 'Владелец' : (developer ? 'Разработчик' : 'Пользователь');
  var permission = owner ? 'owner' : (developer ? 'developer' : 'view');

  if (!owner && !developer && typeof getUserRole === 'function') {
    accessRole = getUserRole(id) || accessRole;
  }
  if (!owner && !developer && typeof getUserPermission === 'function') {
    permission = getUserPermission(id) || permission;
  }

  var canManageStudents =
    owner ||
    developer ||
    permission === 'manage_students' ||
    (typeof hasPermission === 'function' && hasPermission(id, 'manage_students'));

  var position = typeof getCouncilPosition_ === 'function'
    ? getCouncilPosition_(id)
    : { roleId: 'member', sector: '', label: accessRole };

  var positionRole = String(position && position.roleId || '');
  var displayRole = position && position.label ? position.label : accessRole;

  var canAssignRoles = owner || developer || permission === 'manage_students';
  var canCreateTasks =
    owner ||
    developer ||
    canManageStudents ||
    positionRole === 'chair' ||
    positionRole === 'vice_chair' ||
    positionRole === 'sector_head';

  var canManageTasks = owner || developer || canManageStudents;

  return {
    id: id,
    firstName: verified.user.first_name || '',
    lastName: verified.user.last_name || '',
    username: verified.user.username || '',
    photoUrl: verified.user.photo_url || '',
    role: displayRole,
    accessRole: accessRole,
    permission: permission,
    position: position,
    canManage: !!canManageStudents,
    canAssignRoles: !!canAssignRoles,
    canCreateTasks: !!canCreateTasks,
    canManageTasks: !!canManageTasks,
    canOpenSpecial: !!(owner || developer),
    isOwner: !!owner,
    isDeveloper: !!developer
  };
}

/* CAMPUS_BACKEND_SESSION_CACHE_V13_13 */
function campusSessionCacheKey_(initData) {
  try {
    var bytes =
      Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        String(initData || ''),
        Utilities.Charset.UTF_8
      );

    return (
      'campus_session_v14_' +
      Utilities
        .base64EncodeWebSafe(bytes)
        .substring(0, 44)
    );
  } catch (e) {
    return '';
  }
}

function getAppSession_(initData) {
  var session = null;
  var cacheKey =
    campusSessionCacheKey_(initData);

  if (cacheKey) {
    try {
      var cached =
        CacheService
          .getScriptCache()
          .get(cacheKey);

      if (cached) {
        session = JSON.parse(cached);
      }
    } catch (e) {}
  }

  if (!session) {
    session = getAppIdentity_(initData);

    if (cacheKey) {
      try {
        CacheService
          .getScriptCache()
          .put(
            cacheKey,
            JSON.stringify(session),
            60
          );
      } catch (e) {}
    }
  }

  // Maintenance remains live on every request.
  if (
    typeof getMaintenanceState_ === 'function' &&
    !session.isOwner &&
    !session.isDeveloper
  ) {
    var maintenance =
      getMaintenanceState_();

    if (maintenance.enabled) {
      throw new Error(
        'CAMPUS_MAINTENANCE|' +
        String(
          maintenance.message ||
          'Происходят технические работы. Пожалуйста, подождите.'
        )
      );
    }
  }

  return session;
}

function requireManage_(session) {
  if (!session || !session.canManage) {
    throw new Error('Недостаточно прав для изменения данных.');
  }
}
