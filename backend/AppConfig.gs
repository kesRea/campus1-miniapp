const CAMPUS_APP = Object.freeze({
  title: 'Campus №1',
  subtitle: 'База данных',
  university: 'Toraighyrov University',
  defaultRoomCapacity: null,
  telegramAuthMaxAgeSeconds: 86400
});

function getCampusRooms_() {
  const rooms = [13, 14, 23];
  for (let room = 30; room <= 162; room++) {
    if (room === 118 || room === 126 || room === 127) continue;
    rooms.push(room);
  }
  return rooms;
}

function getAppDatabaseConfig_() {
  const props = PropertiesService.getScriptProperties();
  return {
    students: {
      spreadsheetId: props.getProperty('APP_DB_STUDENTS_ID') || SS_ID,
      sheetName: props.getProperty('APP_DB_STUDENTS_SHEET') || ''
    },
    foreigners: {
      spreadsheetId: props.getProperty('APP_DB_FOREIGNERS_ID') || SS_ID,
      sheetName: props.getProperty('APP_DB_FOREIGNERS_SHEET') || 'Иностранцы'
    },
    council: {
      spreadsheetId: props.getProperty('APP_DB_COUNCIL_ID') || SS_ID,
      sheetName: props.getProperty('APP_DB_COUNCIL_SHEET') || 'Студсовет'
    },
    activists: {
      spreadsheetId: props.getProperty('APP_DB_ACTIVISTS_ID') || SS_ID,
      sheetName: props.getProperty('APP_DB_ACTIVISTS_SHEET') || 'Активисты'
    },
    control: {
      spreadsheetId: props.getProperty('APP_DB_CONTROL_ID') || SS_ID,
      sheetName: props.getProperty('APP_DB_CONTROL_SHEET') || 'Контроль'
    },
    journal: {
      spreadsheetId: props.getProperty('APP_DB_JOURNAL_ID') || SS_ID,
      sheetName: props.getProperty('APP_DB_JOURNAL_SHEET') || 'Журнал'
    },
    documents: {
      spreadsheetId: props.getProperty('APP_DB_DOCUMENTS_ID') || SS_ID,
      sheetName: props.getProperty('APP_DB_DOCUMENTS_SHEET') || 'Документы'
    }
  };
}

function getConfiguredSheet_(key, createIfMissing) {
  const cfg = getAppDatabaseConfig_()[key];
  if (!cfg) throw new Error('Неизвестная база: ' + key);

  const ss = SpreadsheetApp.openById(cfg.spreadsheetId);
  if (!cfg.sheetName) return ss.getSheets()[0];

  let sheet = ss.getSheetByName(cfg.sheetName);
  if (!sheet && createIfMissing) sheet = ss.insertSheet(cfg.sheetName);
  return sheet;
}
