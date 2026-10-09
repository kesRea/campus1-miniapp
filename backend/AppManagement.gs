/* CAMPUS_BACKEND_MANAGEMENT_V14 */
var CAMPUS_DEVELOPER_ID_V13_12_5 = '7272434463';
var CAMPUS_BACKEND_VERSION_V13_12_5 = '14.1.3';
var CAMPUS_ROLE_SHEET_V13_12_5 = 'Campus_Роли';

function isCampusDeveloperId_(id) {
  return String(id || '') === String(CAMPUS_DEVELOPER_ID_V13_12_5);
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

function ensureCouncilRoleSheet_() {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName(CAMPUS_ROLE_SHEET_V13_12_5);

  if (!sheet) {
    sheet = ss.insertSheet(CAMPUS_ROLE_SHEET_V13_12_5);
    sheet.getRange(1, 1, 1, 6).setValues([[
      'Telegram ID',
      'Role ID',
      'Sector',
      'Label',
      'Updated At',
      'Updated By'
    ]]);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function findCouncilRoleRow_(sheet, userId) {
  var id = String(userId || '');
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) return 0;

  var values = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();

  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0] || '').trim() === id) return i + 2;
  }

  return 0;
}

function normalizeCouncilPosition_(roleId, sector) {
  var allowed = getCouncilRoleDefinitions_().map(function(item) {
    return item.id;
  });

  roleId = String(roleId || 'member');

  if (allowed.indexOf(roleId) === -1) roleId = 'member';

  sector = normalizeCouncilSector_(sector);

  if (roleId === 'chair' || roleId === 'vice_chair') {
    sector = '';
  }

  return {
    roleId: roleId,
    sector: sector,
    label: councilPositionLabel_(roleId, sector)
  };
}

function readCouncilPositionFromSheet_(userId) {
  var sheet = ensureCouncilRoleSheet_();
  var row = findCouncilRoleRow_(sheet, userId);

  if (!row) return null;

  var values = sheet.getRange(row, 1, 1, 6).getDisplayValues()[0];
  var position = normalizeCouncilPosition_(values[1], values[2]);

  position.updatedAt = String(values[4] || '');
  position.updatedBy = String(values[5] || '');
  position.source = 'sheet';

  return position;
}

function writeCouncilPositionToSheet_(userId, position, updatedBy) {
  var sheet = ensureCouncilRoleSheet_();
  var id = String(userId || '');
  var row = findCouncilRoleRow_(sheet, id);
  var now = new Date().toISOString();

  var values = [[
    id,
    String(position.roleId || 'member'),
    String(position.sector || ''),
    String(position.label || ''),
    now,
    String(updatedBy || '')
  ]];

  if (row) {
    sheet.getRange(row, 1, 1, 6).setValues(values);
  } else {
    sheet.appendRow(values[0]);
  }

  return {
    roleId: String(position.roleId || 'member'),
    sector: String(position.sector || ''),
    label: String(position.label || ''),
    updatedAt: now,
    updatedBy: String(updatedBy || ''),
    source: 'sheet'
  };
}

function readLegacyCouncilPosition_(userId) {
  var raw = PropertiesService
    .getScriptProperties()
    .getProperty('COUNCIL_POSITION_' + String(userId || ''));

  if (!raw) return null;

  try {
    var parsed = JSON.parse(raw);
    var position = normalizeCouncilPosition_(parsed.roleId, parsed.sector);
    position.updatedAt = String(parsed.updatedAt || '');
    position.updatedBy = String(parsed.updatedBy || '');
    position.source = 'legacy';
    return position;
  } catch (e) {
    return null;
  }
}

function getCouncilPosition_(userId) {
  var id = String(userId || '');

  var fromSheet = readCouncilPositionFromSheet_(id);
  if (fromSheet) return fromSheet;

  var legacy = readLegacyCouncilPosition_(id);

  if (legacy) {
    try {
      return writeCouncilPositionToSheet_(id, legacy, 'migration');
    } catch (e) {
      return legacy;
    }
  }

  if (typeof OWNER_ID !== 'undefined' && id === String(OWNER_ID)) {
    return {
      roleId: 'sector_head',
      sector: 'СДК',
      label: 'Глава СДК',
      source: 'owner-default'
    };
  }

  var accessRole = '';

  try {
    accessRole = typeof getUserRole === 'function'
      ? String(getUserRole(id) || '')
      : '';
  } catch (e2) {}

  if (accessRole.toLowerCase().indexOf('актив') !== -1) {
    return {
      roleId: 'activist',
      sector: '',
      label: 'Активист',
      source: 'access-role'
    };
  }

  return {
    roleId: 'member',
    sector: '',
    label: 'Участник',
    source: 'default'
  };
}

function setCouncilPosition_(userId, roleId, sector, updatedBy) {
  var id = String(userId || '');
  var allowed = getCouncilRoleDefinitions_().map(function(item) {
    return item.id;
  });

  roleId = String(roleId || 'member');

  if (allowed.indexOf(roleId) === -1) {
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

  var position = {
    roleId: roleId,
    sector: sector,
    label: councilPositionLabel_(roleId, sector)
  };

  var stored = writeCouncilPositionToSheet_(
    id,
    position,
    updatedBy
  );

  PropertiesService
    .getScriptProperties()
    .setProperty(
      'COUNCIL_POSITION_' + id,
      JSON.stringify({
        roleId: stored.roleId,
        sector: stored.sector,
        label: stored.label,
        updatedAt: stored.updatedAt,
        updatedBy: stored.updatedBy
      })
    );

  var verify = readCouncilPositionFromSheet_(id);

  if (
    !verify ||
    verify.roleId !== stored.roleId ||
    String(verify.sector || '') !== String(stored.sector || '')
  ) {
    throw new Error('Роль не сохранилась. Повторите ещё раз.');
  }

  return verify;
}

function getCampusUserInfo_(id) {
  id = String(id || '');

  var props = PropertiesService.getScriptProperties();
  var info = {};

  try {
    info = JSON.parse(
      props.getProperty('USER_INFO_' + id) || '{}'
    );
  } catch (e) {
    info = {};
  }

  var name = [
    String(info.firstName || '').trim(),
    String(info.lastName || '').trim()
  ].filter(Boolean).join(' ');

  if (!name) {
    if (typeof OWNER_ID !== 'undefined' && id === String(OWNER_ID)) {
      name = 'Владелец';
    } else if (isCampusDeveloperId_(id)) {
      name = 'Разработчик';
    } else {
      name = 'Участник ' + id;
    }
  }

  return {
    id: id,
    name: name,
    username: String(info.username || ''),
    photoUrl: String(info.photoUrl || '')
  };
}

function getCampusAccessRole_(id) {
  id = String(id || '');

  if (typeof OWNER_ID !== 'undefined' && id === String(OWNER_ID)) {
    return 'Владелец';
  }

  if (isCampusDeveloperId_(id)) {
    return 'Разработчик';
  }

  try {
    var role = typeof getUserRole === 'function'
      ? getUserRole(id)
      : '';

    if (role) return String(role);
  } catch (e) {}

  try {
    var permission = typeof getUserPermission === 'function'
      ? getUserPermission(id)
      : 'view';

    return permission === 'manage_students'
      ? 'Администрация'
      : 'Пользователь';

  } catch (e2) {}

  return 'Пользователь';
}

function getCampusKnownUserIds_() {
  var ids = [];

  try {
    if (typeof getAllowedUsers === 'function') {
      ids = getAllowedUsers().map(String);
    }
  } catch (e) {}

  if (typeof OWNER_ID !== 'undefined') {
    ids.push(String(OWNER_ID));
  }

  ids.push(String(CAMPUS_DEVELOPER_ID_V13_12_5));

  var unique = {};

  return ids.filter(function(id) {
    id = String(id || '');

    if (!id || unique[id]) return false;

    unique[id] = true;
    return true;
  });
}

function readCouncilPositionMapFast_() {
  var result = {};
  var sheet = ensureCouncilRoleSheet_();
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) return result;

  var values =
    sheet
      .getRange(2, 1, lastRow - 1, 6)
      .getDisplayValues();

  values.forEach(function(row) {
    var id = String(row[0] || '').trim();
    if (!id) return;

    var position =
      normalizeCouncilPosition_(
        row[1],
        row[2]
      );

    position.updatedAt = String(row[4] || '');
    position.updatedBy = String(row[5] || '');
    position.source = 'sheet';

    result[id] = position;
  });

  return result;
}

function getCouncilDirectoryEntries_() {
  var ids = getCampusKnownUserIds_();
  var entries = [];
  var positionMap = readCouncilPositionMapFast_();

  ids.forEach(function(id) {
    id = String(id || '');

    var position = positionMap[id] || null;
    var include = false;

    if (!position) {
      position = readLegacyCouncilPosition_(id);
    }

    if (position) {
      include = true;
    } else if (
      typeof OWNER_ID !== 'undefined' &&
      id === String(OWNER_ID)
    ) {
      position = {
        roleId: 'sector_head',
        sector: 'СДК',
        label: 'Глава СДК',
        source: 'owner-default'
      };
      include = true;
    } else {
      var accessRole = '';

      try {
        accessRole =
          typeof getUserRole === 'function'
            ? String(getUserRole(id) || '')
            : '';
      } catch (e2) {}

      if (
        accessRole
          .toLowerCase()
          .indexOf('актив') !== -1
      ) {
        position = {
          roleId: 'activist',
          sector: '',
          label: 'Активист',
          source: 'access-role'
        };
        include = true;
      }
    }

    if (!include || !position) return;

    var info = getCampusUserInfo_(id);

    entries.push({
      id: id,
      name: info.name,
      username: info.username,
      photoUrl: info.photoUrl,
      accessRole: getCampusAccessRole_(id),
      position: position
    });
  });

  entries.sort(function(a, b) {
    return String(a.name).localeCompare(
      String(b.name),
      'ru'
    );
  });

  return entries;
}

function getCouncilDirectoryCounts_() {
  var entries = getCouncilDirectoryEntries_();

  return {
    council: entries.filter(function(item) {
      return item.position.roleId !== 'activist';
    }).length,
    activists: entries.filter(function(item) {
      return item.position.roleId === 'activist';
    }).length
  };
}

function getMaintenanceState_() {
  var props = PropertiesService.getScriptProperties();

  return {
    enabled: props.getProperty('CAMPUS_MAINTENANCE_ENABLED') === '1',
    message:
      props.getProperty('CAMPUS_MAINTENANCE_MESSAGE') ||
      'Происходят технические работы. Пожалуйста, подождите.',
    updatedAt:
      props.getProperty('CAMPUS_MAINTENANCE_UPDATED_AT') || '',
    updatedBy:
      props.getProperty('CAMPUS_MAINTENANCE_UPDATED_BY') || ''
  };
}

function appGetMaintenanceStatus(initData) {
  var session = getAppIdentity_(initData);
  var maintenance = getMaintenanceState_();

  return {
    enabled: !!maintenance.enabled,
    blocked:
      !!maintenance.enabled &&
      !session.isOwner &&
      !session.isDeveloper,
    message: maintenance.message,
    updatedAt: maintenance.updatedAt,
    updatedBy: maintenance.updatedBy,
    user: session
  };
}

function appSetMaintenance(initData, enabled, message) {
  var session = getAppIdentity_(initData);

  if (!session.isOwner && !session.isDeveloper) {
    throw new Error(
      'Технические работы могут включать только владелец и разработчик.'
    );
  }

  var props = PropertiesService.getScriptProperties();
  var text = String(message || '').trim();

  if (!text) {
    text =
      'Происходят технические работы. Пожалуйста, подождите.';
  }

  if (text.length > 500) {
    text = text.substring(0, 500);
  }

  props.setProperty(
    'CAMPUS_MAINTENANCE_ENABLED',
    enabled ? '1' : '0'
  );

  props.setProperty(
    'CAMPUS_MAINTENANCE_MESSAGE',
    text
  );

  props.setProperty(
    'CAMPUS_MAINTENANCE_UPDATED_AT',
    new Date().toISOString()
  );

  props.setProperty(
    'CAMPUS_MAINTENANCE_UPDATED_BY',
    String(session.id)
  );

  return appGetMaintenanceStatus(initData);
}

function appGetSpecialAccess(initData) {
  var session = getAppIdentity_(initData);

  return {
    canOpen: !!(session.isOwner || session.isDeveloper),
    isOwner: !!session.isOwner,
    isDeveloper: !!session.isDeveloper,
    id: String(session.id),
    appVersion: CAMPUS_BACKEND_VERSION_V13_12_5
  };
}

function appGetCouncilRoles(initData) {
  var session = getAppSession_(initData);

  if (!session.canAssignRoles) {
    throw new Error(
      'Недостаточно прав для выдачи должностей.'
    );
  }

  var users = getCampusKnownUserIds_().map(function(id) {
    var info = getCampusUserInfo_(id);
    var position = getCouncilPosition_(id);

    return {
      id: id,
      name: info.name,
      username: info.username,
      photoUrl: info.photoUrl,
      role: position.label,
      accessRole: getCampusAccessRole_(id),
      position: position
    };
  });

  users.sort(function(a, b) {
    return String(a.name).localeCompare(
      String(b.name),
      'ru'
    );
  });

  return {
    users: users,
    roles: getCouncilRoleDefinitions_(),
    sectors: getCouncilSectors_(),
    storage: CAMPUS_ROLE_SHEET_V13_12_5
  };
}

function appSetCouncilRole(
  initData,
  userId,
  roleId,
  sector
) {
  var session = getAppSession_(initData);

  if (!session.canAssignRoles) {
    throw new Error(
      'Недостаточно прав для выдачи должностей.'
    );
  }

  var id = String(userId || '');

  if (getCampusKnownUserIds_().indexOf(id) === -1) {
    throw new Error(
      'Пользователь не найден в списке доступа.'
    );
  }

  var position = setCouncilPosition_(
    id,
    roleId,
    sector,
    session.id
  );

  return {
    ok: true,
    role: position.label,
    position: position,
    persisted: true,
    storage: CAMPUS_ROLE_SHEET_V13_12_5
  };
}
