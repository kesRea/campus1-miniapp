/* CAMPUS_BACKEND_MANAGEMENT_V13_11 */
var CAMPUS_DEVELOPER_ID_V13_11 = '7272434463';
var CAMPUS_BACKEND_VERSION_V13_11 = '13.11.0';

function isCampusDeveloperId_(id) {
  return String(id || '') === String(CAMPUS_DEVELOPER_ID_V13_11);
}

function getCouncilRoleDefinitions_() {
  return [
    { id: 'chair', label: 'Председатель' },
    { id: 'vice_chair', label: 'Заместитель председателя' },
    { id: 'sector_head', label: 'Глава сектора' },
    { id: 'sector_deputy', label: 'Заместитель главы сектора' },
    { id: 'member', label: 'Участник' },
    { id: 'activist', label: 'Активист' }
  ];
}

function getCouncilSectors_() {
  return ['СДК', 'SMM', 'ОПМ', 'САН'];
}

function normalizeCouncilSector_(sector) {
  sector = String(sector || '').trim().toUpperCase();
  var sectors = getCouncilSectors_();
  return sectors.indexOf(sector) !== -1 ? sector : '';
}

function councilPositionLabel_(roleId, sector) {
  roleId = String(roleId || 'member');
  sector = normalizeCouncilSector_(sector);

  if (roleId === 'chair') return 'Председатель';
  if (roleId === 'vice_chair') return 'Заместитель председателя';
  if (roleId === 'sector_head') return sector ? 'Глава ' + sector : 'Глава сектора';
  if (roleId === 'sector_deputy') return sector ? 'Заместитель главы ' + sector : 'Заместитель главы сектора';
  if (roleId === 'activist') return sector ? 'Активист · ' + sector : 'Активист';
  return sector ? 'Участник · ' + sector : 'Участник';
}

function getCouncilPosition_(userId) {
  var id = String(userId || '');
  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty('COUNCIL_POSITION_' + id);

  if (raw) {
    try {
      var parsed = JSON.parse(raw);
      var roleId = String(parsed.roleId || 'member');
      var allowed = getCouncilRoleDefinitions_().map(function(x){ return x.id; });
      if (allowed.indexOf(roleId) === -1) roleId = 'member';
      var sector = normalizeCouncilSector_(parsed.sector);
      if (roleId === 'chair' || roleId === 'vice_chair') sector = '';
      return {
        roleId: roleId,
        sector: sector,
        label: councilPositionLabel_(roleId, sector)
      };
    } catch (e) {}
  }

  if (typeof OWNER_ID !== 'undefined' && id === String(OWNER_ID)) {
    return {
      roleId: 'sector_head',
      sector: 'СДК',
      label: 'Глава СДК'
    };
  }

  var accessRole = '';
  try {
    accessRole = typeof getUserRole === 'function' ? String(getUserRole(id) || '') : '';
  } catch (e2) {}

  if (accessRole.toLowerCase().indexOf('актив') !== -1) {
    return { roleId: 'activist', sector: '', label: 'Активист' };
  }

  return { roleId: 'member', sector: '', label: 'Участник' };
}

function setCouncilPosition_(userId, roleId, sector) {
  var id = String(userId || '');
  var allowedRoles = getCouncilRoleDefinitions_().map(function(x){ return x.id; });
  roleId = String(roleId || 'member');

  if (allowedRoles.indexOf(roleId) === -1) {
    throw new Error('Неизвестная должность.');
  }

  sector = normalizeCouncilSector_(sector);

  if (
    (roleId === 'sector_head' || roleId === 'sector_deputy') &&
    !sector
  ) {
    throw new Error('Для этой должности нужно выбрать сектор.');
  }

  if (roleId === 'chair' || roleId === 'vice_chair') {
    sector = '';
  }

  var value = {
    roleId: roleId,
    sector: sector,
    label: councilPositionLabel_(roleId, sector),
    updatedAt: new Date().toISOString()
  };

  PropertiesService
    .getScriptProperties()
    .setProperty('COUNCIL_POSITION_' + id, JSON.stringify(value));

  return value;
}

function getCampusUserInfo_(id) {
  id = String(id || '');
  var props = PropertiesService.getScriptProperties();
  var info = {};

  try {
    info = JSON.parse(props.getProperty('USER_INFO_' + id) || '{}');
  } catch (e) {
    info = {};
  }

  var name = [
    String(info.firstName || '').trim(),
    String(info.lastName || '').trim()
  ].filter(Boolean).join(' ');

  if (!name) {
    if (typeof OWNER_ID !== 'undefined' && id === String(OWNER_ID)) name = 'Владелец';
    else if (isCampusDeveloperId_(id)) name = 'Разработчик';
    else name = 'Участник ' + id;
  }

  return {
    id: id,
    name: name,
    username: String(info.username || '')
  };
}

function getCampusAccessRole_(id) {
  id = String(id || '');
  if (typeof OWNER_ID !== 'undefined' && id === String(OWNER_ID)) return 'Владелец';
  if (isCampusDeveloperId_(id)) return 'Разработчик';

  try {
    var role = typeof getUserRole === 'function' ? getUserRole(id) : '';
    if (role) return String(role);
  } catch (e) {}

  try {
    var permission = typeof getUserPermission === 'function' ? getUserPermission(id) : 'view';
    return permission === 'manage_students' ? 'Администрация' : 'Пользователь';
  } catch (e2) {}

  return 'Пользователь';
}

function getCampusKnownUserIds_() {
  var ids = [];

  try {
    if (typeof getAllowedUsers === 'function') ids = getAllowedUsers().map(String);
  } catch (e) {}

  if (typeof OWNER_ID !== 'undefined') ids.push(String(OWNER_ID));
  ids.push(String(CAMPUS_DEVELOPER_ID_V13_11));

  var unique = {};
  return ids.filter(function(id) {
    id = String(id || '');
    if (!id || unique[id]) return false;
    unique[id] = true;
    return true;
  });
}

function getMaintenanceState_() {
  var props = PropertiesService.getScriptProperties();
  return {
    enabled: props.getProperty('CAMPUS_MAINTENANCE_ENABLED') === '1',
    message: props.getProperty('CAMPUS_MAINTENANCE_MESSAGE') ||
      'Происходят технические работы. Пожалуйста, подождите.',
    updatedAt: props.getProperty('CAMPUS_MAINTENANCE_UPDATED_AT') || '',
    updatedBy: props.getProperty('CAMPUS_MAINTENANCE_UPDATED_BY') || ''
  };
}

function appGetMaintenanceStatus(initData) {
  var session = getAppIdentity_(initData);
  var maintenance = getMaintenanceState_();

  return {
    enabled: !!maintenance.enabled,
    blocked: !!maintenance.enabled && !session.isOwner && !session.isDeveloper,
    message: maintenance.message,
    updatedAt: maintenance.updatedAt,
    updatedBy: maintenance.updatedBy,
    user: session
  };
}

function appSetMaintenance(initData, enabled, message) {
  var session = getAppIdentity_(initData);

  if (!session.isOwner && !session.isDeveloper) {
    throw new Error('Технические работы могут включать только владелец и разработчик.');
  }

  var props = PropertiesService.getScriptProperties();
  var text = String(message || '').trim();
  if (!text) text = 'Происходят технические работы. Пожалуйста, подождите.';
  if (text.length > 500) text = text.substring(0, 500);

  props.setProperty('CAMPUS_MAINTENANCE_ENABLED', enabled ? '1' : '0');
  props.setProperty('CAMPUS_MAINTENANCE_MESSAGE', text);
  props.setProperty('CAMPUS_MAINTENANCE_UPDATED_AT', new Date().toISOString());
  props.setProperty('CAMPUS_MAINTENANCE_UPDATED_BY', String(session.id));

  return appGetMaintenanceStatus(initData);
}

function appGetSpecialAccess(initData) {
  var session = getAppIdentity_(initData);
  var canOpen = !!(session.isOwner || session.isDeveloper);

  return {
    canOpen: canOpen,
    isOwner: !!session.isOwner,
    isDeveloper: !!session.isDeveloper,
    id: String(session.id),
    appVersion: CAMPUS_BACKEND_VERSION_V13_11
  };
}

function appGetCouncilRoles(initData) {
  var session = getAppSession_(initData);

  if (!session.canAssignRoles) {
    throw new Error('Недостаточно прав для выдачи должностей.');
  }

  var users = getCampusKnownUserIds_().map(function(id) {
    var info = getCampusUserInfo_(id);
    var position = getCouncilPosition_(id);
    return {
      id: id,
      name: info.name,
      username: info.username,
      role: position.label,
      accessRole: getCampusAccessRole_(id),
      position: position
    };
  });

  users.sort(function(a, b) {
    return String(a.name).localeCompare(String(b.name), 'ru');
  });

  return {
    users: users,
    roles: getCouncilRoleDefinitions_(),
    sectors: getCouncilSectors_()
  };
}

function appSetCouncilRole(initData, userId, roleId, sector) {
  var session = getAppSession_(initData);

  if (!session.canAssignRoles) {
    throw new Error('Недостаточно прав для выдачи должностей.');
  }

  var id = String(userId || '');
  if (getCampusKnownUserIds_().indexOf(id) === -1) {
    throw new Error('Пользователь не найден в списке доступа.');
  }

  var position = setCouncilPosition_(id, roleId, sector);

  return {
    ok: true,
    role: position.label,
    position: position
  };
}
