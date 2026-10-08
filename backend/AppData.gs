function getStudentSheet_() {
  return getConfiguredSheet_('students', false);
}

function getStudentDisplayRows_() {
  const sheet = getStudentSheet_();
  const values = sheet.getDataRange().getDisplayValues();
  return { sheet: sheet, values: values };
}

function mapStudentRow_(row, rowNumber) {
  return {
    rowNumber: rowNumber,
    number: String(row[0] || '').trim(),
    fio: String(row[1] || '').trim(),
    dateIn: String(row[2] || '').trim(),
    birthDate: String(row[3] || '').trim(),
    iin: String(row[4] || '').trim(),
    faculty: String(row[5] || '').trim(),
    room: String(row[6] || '').trim(),
    registration: String(row[7] || '').trim(),
    payment: String(row[8] || '').trim(),
    evictionDate: String(row[9] || '').trim(),
    active: !String(row[9] || '').trim()
  };
}

function getCurrentStudents_() {
  const data = getStudentDisplayRows_().values;
  const result = [];
  for (let i = 1; i < data.length; i++) {
    const s = mapStudentRow_(data[i], i + 1);
    if (s.fio && s.active) result.push(s);
  }
  return result;
}

function appBootstrap(initData) {
  const session = getAppSession_(initData);
  return {
    ok: true,
    app: CAMPUS_APP,
    user: session,
    rooms: getCampusRooms_(),
    dashboard: buildDashboard_(),
    analytics: null
  };
}

function appGetDashboard(initData) {
  getAppSession_(initData);
  return buildDashboard_();
}

function buildDashboard_() {
  const data = getStudentDisplayRows_().values;
  let totalStudents = 0, currentStudents = 0, evictedStudents = 0;
  const occupied = {};

  for (let i = 1; i < data.length; i++) {
    const s = mapStudentRow_(data[i], i + 1);
    if (!s.fio) continue;
    totalStudents++;
    if (s.active) {
      currentStudents++;
      if (s.room) occupied[s.room] = true;
    } else {
      evictedStudents++;
    }
  }

  const rooms = getCampusRooms_().map(String);
  const occupiedRooms = rooms.filter(function(r) { return occupied[r]; }).length;
  const foreigners = readOptionalTable_('foreigners').rows.length;
  const council = readOptionalTable_('council').rows.length;
  const activists = readOptionalTable_('activists').rows.length || countActivistsFromAccess_();

  return {
    totalStudents: totalStudents,
    currentStudents: currentStudents,
    evictedStudents: evictedStudents,
    totalRooms: rooms.length,
    occupiedRooms: occupiedRooms,
    freeRooms: Math.max(0, rooms.length - occupiedRooms),
    foreigners: foreigners,
    council: council,
    activists: activists
  };
}

function countActivistsFromAccess_() {
  if (typeof getAllowedUsers !== 'function' || typeof getUserRole !== 'function') return 0;
  try {
    return getAllowedUsers().filter(function(id) {
      return String(getUserRole(id) || '').indexOf('Актив') !== -1;
    }).length;
  } catch (e) { return 0; }
}

function appGetAnalytics(initData) {
  getAppSession_(initData);
  return buildAnalytics_();
}

function buildAnalytics_() {
  const students = getStudentDisplayRows_().values;
  const rooms = getCampusRooms_().map(String);
  const counts = {};
  rooms.forEach(function(r) { counts[r] = 0; });

  for (let i = 1; i < students.length; i++) {
    const s = mapStudentRow_(students[i], i + 1);
    if (s.fio && s.active && counts.hasOwnProperty(s.room)) counts[s.room]++;
  }

  const distribution = { empty: 0, one: 0, two: 0, three: 0, fourPlus: 0 };
  rooms.forEach(function(r) {
    const n = counts[r] || 0;
    if (n === 0) distribution.empty++;
    else if (n === 1) distribution.one++;
    else if (n === 2) distribution.two++;
    else if (n === 3) distribution.three++;
    else distribution.fourPlus++;
  });

  const months = [];
  const now = new Date();
  for (let offset = 5; offset >= 0; offset--) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM');
    months.push({
      key: key,
      label: ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'][d.getMonth()],
      inCount: 0,
      outCount: 0
    });
  }
  const byKey = {}; months.forEach(function(m) { byKey[m.key] = m; });

  for (let i = 1; i < students.length; i++) {
    const s = mapStudentRow_(students[i], i + 1);
    if (!s.fio) continue;
    const din = parseCampusDate_(s.dateIn);
    const dout = parseCampusDate_(s.evictionDate);
    if (din) {
      const k = Utilities.formatDate(din, Session.getScriptTimeZone(), 'yyyy-MM');
      if (byKey[k]) byKey[k].inCount++;
    }
    if (dout) {
      const k2 = Utilities.formatDate(dout, Session.getScriptTimeZone(), 'yyyy-MM');
      if (byKey[k2]) byKey[k2].outCount++;
    }
  }

  return {
    dashboard: buildDashboard_(),
    distribution: distribution,
    months: months
  };
}

function parseCampusDate_(text) {
  text = String(text || '').trim();
  let m = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  const d = new Date(text);
  return isNaN(d.getTime()) ? null : d;
}

function appSearchStudents(initData, query) {
  getAppSession_(initData);
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  const digits = q.replace(/\D/g, '');
  const data = getStudentDisplayRows_().values;
  const result = [];

  for (let i = 1; i < data.length; i++) {
    const s = mapStudentRow_(data[i], i + 1);
    if (!s.fio) continue;
    const fio = s.fio.toLowerCase();
    const iin = s.iin.toLowerCase();
    const iinDigits = iin.replace(/\D/g, '');
    const faculty = s.faculty.toLowerCase();
    if (fio.indexOf(q) !== -1 || iin.indexOf(q) !== -1 ||
        (digits && iinDigits.indexOf(digits) !== -1) || s.room.toLowerCase() === q ||
        faculty.indexOf(q) !== -1) {
      result.push(s);
      if (result.length >= 50) break;
    }
  }
  return result;
}

function appGetStudents(initData, mode) {
  getAppSession_(initData);
  const data = getStudentDisplayRows_().values;
  const result = [];
  for (let i = 1; i < data.length; i++) {
    const s = mapStudentRow_(data[i], i + 1);
    if (!s.fio) continue;
    if (mode === 'active' && !s.active) continue;
    if (mode === 'evicted' && s.active) continue;
    result.push(s);
  }
  return result.slice(0, 500);
}

function appGetStudent(initData, rowNumber) {
  getAppSession_(initData);
  const sheet = getStudentSheet_();
  rowNumber = Number(rowNumber);
  if (!rowNumber || rowNumber < 2 || rowNumber > sheet.getLastRow()) throw new Error('Студент не найден.');
  return mapStudentRow_(sheet.getRange(rowNumber, 1, 1, 10).getDisplayValues()[0], rowNumber);
}

function appGetRooms(initData) {
  getAppSession_(initData);
  const students = getCurrentStudents_();
  const byRoom = {};
  students.forEach(function(s) {
    if (!byRoom[s.room]) byRoom[s.room] = [];
    byRoom[s.room].push(s);
  });
  return getCampusRooms_().map(function(room) {
    const list = byRoom[String(room)] || [];
    return { room: String(room), occupants: list.length, names: list.slice(0, 3).map(function(s){return s.fio;}) };
  });
}

function appGetRoom(initData, room) {
  getAppSession_(initData);
  const r = String(room);
  if (getCampusRooms_().map(String).indexOf(r) === -1) throw new Error('Такой комнаты нет в Campus №1.');
  const occupants = getCurrentStudents_().filter(function(s) { return s.room === r; });
  return { room: r, occupants: occupants };
}

function appAddStudent(initData, payload) {
  const session = getAppSession_(initData); requireManage_(session);
  payload = payload || {};
  const room = String(payload.room || '').trim();
  if (getCampusRooms_().map(String).indexOf(room) === -1) throw new Error('Выберите существующую комнату Campus №1.');
  const fio = String(payload.fio || '').trim();
  if (!fio) throw new Error('Введите ФИО.');

  const sheet = getStudentSheet_();
  const number = Math.max(1, sheet.getLastRow());
  sheet.appendRow([
    number, fio, payload.dateIn || '', payload.birthDate || '', payload.iin || '',
    payload.faculty || '', room, payload.registration || '', payload.payment || '', ''
  ]);
  if (typeof logAction === 'function') logAction('➕ Добавление (Mini App)', fio, 'Комната: ' + room);
  return { ok: true, message: 'Студент добавлен.' };
}

function appUpdateStudent(initData, rowNumber, payload) {
  const session = getAppSession_(initData); requireManage_(session);
  const sheet = getStudentSheet_();
  rowNumber = Number(rowNumber);
  if (!rowNumber || rowNumber < 2 || rowNumber > sheet.getLastRow()) throw new Error('Студент не найден.');
  const current = sheet.getRange(rowNumber, 1, 1, 10).getDisplayValues()[0];
  const fields = ['number','fio','dateIn','birthDate','iin','faculty','room','registration','payment','evictionDate'];
  const next = current.slice();
  payload = payload || {};
  fields.forEach(function(key, idx) {
    if (payload.hasOwnProperty(key)) next[idx] = payload[key];
  });
  if (next[6] && getCampusRooms_().map(String).indexOf(String(next[6])) === -1) throw new Error('Такой комнаты нет в Campus №1.');
  sheet.getRange(rowNumber, 1, 1, 10).setValues([next]);
  if (typeof logAction === 'function') logAction('✏️ Редактирование (Mini App)', String(next[1] || ''), 'Строка: ' + rowNumber);
  return { ok: true };
}

function appMoveStudent(initData, rowNumber, newRoom) {
  const session = getAppSession_(initData); requireManage_(session);
  const room = String(newRoom || '').trim();
  if (getCampusRooms_().map(String).indexOf(room) === -1) throw new Error('Такой комнаты нет в Campus №1.');
  const sheet = getStudentSheet_();
  rowNumber = Number(rowNumber);
  const current = mapStudentRow_(sheet.getRange(rowNumber, 1, 1, 10).getDisplayValues()[0], rowNumber);
  if (!current.active) throw new Error('Студент уже выселен.');
  sheet.getRange(rowNumber, 7).setValue(room);
  if (typeof logAction === 'function') logAction('🔄 Переселение (Mini App)', current.fio, current.room + ' → ' + room);
  return { ok: true };
}

function appEvictStudent(initData, rowNumber) {
  const session = getAppSession_(initData); requireManage_(session);
  const sheet = getStudentSheet_();
  rowNumber = Number(rowNumber);
  const current = mapStudentRow_(sheet.getRange(rowNumber, 1, 1, 10).getDisplayValues()[0], rowNumber);
  if (!current.fio) throw new Error('Студент не найден.');
  if (!current.active) throw new Error('Студент уже выселен.');
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd.MM.yyyy');
  sheet.getRange(rowNumber, 10).setValue(today);
  sheet.getRange(rowNumber, 1, 1, 10).setBackground('#fde8e8');
  if (typeof logAction === 'function') logAction('📤 Выселение (Mini App)', current.fio, 'Комната: ' + current.room);
  return { ok: true, date: today };
}

function readOptionalTable_(key) {
  const sheet = getConfiguredSheet_(key, false);
  if (!sheet || sheet.getLastRow() < 2) return { headers: [], rows: [], configured: !!sheet };
  const data = sheet.getDataRange().getDisplayValues();
  const headers = data[0].map(function(h) { return String(h || '').trim(); });
  const rows = data.slice(1).filter(function(r){ return r.some(function(v){return String(v||'').trim();}); }).map(function(row, idx) {
    const obj = { _rowNumber: idx + 2 };
    headers.forEach(function(h, i) { obj[h || ('col' + (i + 1))] = row[i] || ''; });
    return obj;
  });
  return { headers: headers, rows: rows, configured: true };
}

function appGetForeigners(initData) {
  getAppSession_(initData);
  return readOptionalTable_('foreigners');
}

function appGetCouncil(initData, kind) {
  getAppSession_(initData);
  const key = kind === 'activists' ? 'activists' : 'council';
  const table = readOptionalTable_(key);
  if (key === 'activists' && table.rows.length === 0 && typeof getAllowedUsers === 'function') {
    try {
      const props = PropertiesService.getScriptProperties();
      table.rows = getAllowedUsers().filter(function(id){
        return typeof getUserRole === 'function' && String(getUserRole(id) || '').indexOf('Актив') !== -1;
      }).map(function(id){
        let info = {}; try { info = JSON.parse(props.getProperty('USER_INFO_' + id) || '{}'); } catch(e){}
        return { 'ФИО': [info.firstName || '', info.lastName || ''].filter(Boolean).join(' '), 'Telegram': info.username ? '@' + info.username : '', 'Роль': getUserRole(id) };
      });
    } catch (e) {}
  }
  return table;
}

function appGetControl(initData) {
  getAppSession_(initData);
  return readOptionalTable_('control');
}

function appGetJournal(initData) {
  getAppSession_(initData);
  const table = readOptionalTable_('journal');
  table.rows = table.rows.slice(-100).reverse();
  return table;
}
