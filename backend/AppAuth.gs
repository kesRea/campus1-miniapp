
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

  const params = {};
  String(initData).split('&').forEach(function(part) {
    const idx = part.indexOf('=');
    const key = decodeURIComponent(idx >= 0 ? part.substring(0, idx) : part);
    const value = decodeURIComponent((idx >= 0 ? part.substring(idx + 1) : '').replace(/\+/g, '%20'));
    params[key] = value;
  });

  const receivedHash = params.hash || '';
  if (!receivedHash) return { ok: false, error: 'Telegram hash отсутствует.' };

  const authDate = Number(params.auth_date || 0);
  const now = Math.floor(Date.now() / 1000);
  if (!authDate || Math.abs(now - authDate) > CAMPUS_APP.telegramAuthMaxAgeSeconds) {
    return { ok: false, error: 'Сессия Telegram устарела. Откройте приложение заново.' };
  }

  const dataCheckString = Object.keys(params)
    .filter(function(key) { return key !== 'hash'; })
    .sort()
    .map(function(key) { return key + '=' + params[key]; })
    .join('\n');

  // Telegram Mini Apps validation:
  // secret_key = HMAC_SHA256(bot_token, key="WebAppData")
  // hash       = HMAC_SHA256(data_check_string, key=secret_key)
  // Apps Script cannot mix String and byte[] in one HMAC call,
  // therefore BOTH arguments are explicitly byte[].
  const tokenBytes = Utilities.newBlob(String(TOKEN), 'text/plain').getBytes();
  const webAppDataBytes = Utilities.newBlob('WebAppData', 'text/plain').getBytes();
  const dataCheckBytes = Utilities.newBlob(String(dataCheckString), 'text/plain').getBytes();

  const secretKey = Utilities.computeHmacSha256Signature(
    tokenBytes,
    webAppDataBytes
  );

  const signature = Utilities.computeHmacSha256Signature(
    dataCheckBytes,
    secretKey
  );

  const calculatedHash = signature.map(function(byte) {
    const v = (byte < 0 ? byte + 256 : byte).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');

  if (!constantTimeEquals_(calculatedHash, receivedHash)) {
    return { ok: false, error: 'Не удалось подтвердить данные Telegram. [HMAC-V2]' };
  }

  let user = null;
  try { user = params.user ? JSON.parse(params.user) : null; } catch (e) {}
  if (!user || !user.id) return { ok: false, error: 'Telegram user отсутствует.' };

  return { ok: true, user: user, authDate: authDate };
}

function constantTimeEquals_(a, b) {
  a = String(a || ''); b = String(b || '');
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function getAppSession_(initData) {
  const verified = validateTelegramInitData_(initData);
  if (!verified.ok) throw new Error(verified.error);

  const id = String(verified.user.id);
  const owner = typeof OWNER_ID !== 'undefined' && id === String(OWNER_ID);
  const allowed = owner || (typeof isAllowed === 'function' && isAllowed(id));
  if (!allowed) throw new Error('У вас нет доступа к Campus №1. Запросите доступ через бота.');

  let role = owner ? 'Владелец' : 'Пользователь';
  let permission = owner ? 'manage_students' : 'view';
  if (!owner && typeof getUserRole === 'function') role = getUserRole(id) || role;
  if (!owner && typeof getUserPermission === 'function') permission = getUserPermission(id) || permission;

  const canManage = owner || permission === 'manage_students' ||
    (typeof hasPermission === 'function' && hasPermission(id, 'manage_students'));

  return {
    id: id,
    firstName: verified.user.first_name || '',
    lastName: verified.user.last_name || '',
    username: verified.user.username || '',
    photoUrl: verified.user.photo_url || '',
    role: role,
    permission: permission,
    canManage: !!canManage,
    isOwner: owner
  };
}

function requireManage_(session) {
  if (!session || !session.canManage) throw new Error('Недостаточно прав для изменения данных.');
}
