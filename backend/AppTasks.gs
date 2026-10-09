/* CAMPUS_TASKS_BACKEND_V14_AVATARS */
/* CAMPUS_BACKEND_TASKS_V13_11 */
var CAMPUS_TASK_SHEET_V13_11 = 'Campus_Задачи';
var CAMPUS_TASK_EVENT_SHEET_V13_11 = 'Campus_Задачи_Журнал';

function taskNowIso_() {
  return new Date().toISOString();
}

function taskNewId_(prefix) {
  return String(prefix || 'T') + '-' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss') +
    '-' + Utilities.getUuid().substring(0, 8);
}

function taskSpreadsheet_() {
  return SpreadsheetApp.openById(SS_ID);
}

function ensureTaskSheet_(name, headers) {
  var ss = taskSpreadsheet_();
  var sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function taskSheet_() {
  return ensureTaskSheet_(CAMPUS_TASK_SHEET_V13_11, [
    'ID',
    'Название',
    'Описание',
    'Проект',
    'Создал ID',
    'Главный ID',
    'Ответственный ID',
    'Статус',
    'Приоритет',
    'Срок',
    'Создано',
    'Обновлено'
  ]);
}

function taskEventSheet_() {
  return ensureTaskSheet_(CAMPUS_TASK_EVENT_SHEET_V13_11, [
    'ID',
    'Task ID',
    'Время',
    'User ID',
    'Тип',
    'Текст'
  ]);
}

function mapTaskRow_(row, rowNumber) {
  return {
    _row: Number(rowNumber),
    id: String(row[0] || ''),
    title: String(row[1] || ''),
    description: String(row[2] || ''),
    project: String(row[3] || ''),
    createdBy: String(row[4] || ''),
    leadId: String(row[5] || ''),
    assigneeId: String(row[6] || ''),
    status: String(row[7] || 'new'),
    priority: String(row[8] || 'normal'),
    dueDate: String(row[9] || ''),
    createdAt: String(row[10] || ''),
    updatedAt: String(row[11] || '')
  };
}

function readAllTasks_() {
  var sheet = taskSheet_();
  if (sheet.getLastRow() < 2) return [];

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 12).getDisplayValues();
  return values
    .map(function(row, idx) { return mapTaskRow_(row, idx + 2); })
    .filter(function(task) { return !!task.id; });
}

function findTaskById_(taskId) {
  taskId = String(taskId || '');
  var tasks = readAllTasks_();

  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].id === taskId) return tasks[i];
  }

  throw new Error('Задача не найдена.');
}

function taskVisibleTo_(session, task) {
  if (!session || !task) return false;
  if (session.canManageTasks) return true;

  var id = String(session.id);
  return (
    String(task.createdBy) === id ||
    String(task.leadId) === id ||
    String(task.assigneeId) === id
  );
}

function taskCanChooseLead_(session, leadId) {
  leadId = String(leadId || '');
  if (!leadId) return false;

  if (session.canManageTasks) {
    return getCampusKnownUserIds_().indexOf(leadId) !== -1;
  }

  var position = session.position || {};
  if (position.roleId === 'sector_head') {
    return leadId === String(session.id);
  }

  if (position.roleId === 'chair' || position.roleId === 'vice_chair') {
    var target = getCouncilPosition_(leadId);
    return target.roleId === 'sector_head';
  }

  return false;
}

function taskCanLeadDelegateTo_(leadId, targetId) {
  leadId = String(leadId || '');
  targetId = String(targetId || '');

  if (!targetId || targetId === leadId) return true;

  var lead = getCouncilPosition_(leadId);
  var target = getCouncilPosition_(targetId);

  if (lead.roleId !== 'sector_head' || !lead.sector) return false;

  var subordinate =
    target.roleId === 'sector_deputy' ||
    target.roleId === 'member' ||
    target.roleId === 'activist';

  return subordinate && String(target.sector || '') === String(lead.sector || '');
}

function getTaskUserDescriptor_(id) {
  id = String(id || '');
  var info = getCampusUserInfo_(id);
  var position = getCouncilPosition_(id);

  return {
    id: id,
    name: info.name,
    username: info.username,
    photoUrl: info.photoUrl,
    role: position.label,
    position: position,
    accessRole: getCampusAccessRole_(id)
  };
}

function appendTaskEvent_(task, userId, type, text) {
  var sheet = taskEventSheet_();
  sheet.appendRow([
    taskNewId_('E'),
    String(task.id),
    taskNowIso_(),
    String(userId || ''),
    String(type || 'event'),
    String(text || '').substring(0, 1200)
  ]);
}

function readTaskEvents_(taskId) {
  var sheet = taskEventSheet_();
  if (sheet.getLastRow() < 2) return [];

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getDisplayValues();
  return values
    .filter(function(row) { return String(row[1]) === String(taskId); })
    .map(function(row) {
      return {
        id: String(row[0] || ''),
        taskId: String(row[1] || ''),
        at: String(row[2] || ''),
        userId: String(row[3] || ''),
        type: String(row[4] || ''),
        text: String(row[5] || '')
      };
    });
}

function updateTaskRow_(task) {
  var sheet = taskSheet_();
  sheet.getRange(task._row, 1, 1, 12).setValues([[
    task.id,
    task.title,
    task.description,
    task.project,
    task.createdBy,
    task.leadId,
    task.assigneeId,
    task.status,
    task.priority,
    task.dueDate,
    task.createdAt,
    task.updatedAt
  ]]);
}

function notifyTaskUser_(userId, text) {
  userId = String(userId || '');
  if (!userId || typeof sendMessage !== 'function') return;

  try {
    sendMessage(userId, String(text || ''));
  } catch (e) {
    console.log('Task notification error: ' + e);
  }
}

function appGetTaskUsers(initData) {
  getAppSession_(initData);

  return getCampusKnownUserIds_()
    .map(getTaskUserDescriptor_)
    .sort(function(a, b) {
      return String(a.name).localeCompare(String(b.name), 'ru');
    });
}

function appGetTasks(initData) {
  var session = getAppSession_(initData);

  return readAllTasks_()
    .filter(function(task) { return taskVisibleTo_(session, task); })
    .sort(function(a, b) {
      return String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt));
    });
}

function appCreateTask(initData, payload) {
  var session = getAppSession_(initData);
  if (!session.canCreateTasks) {
    throw new Error('Недостаточно прав для создания задач.');
  }

  payload = payload || {};

  var title = String(payload.title || '').trim();
  if (!title) throw new Error('Введите название задачи.');
  if (title.length > 120) title = title.substring(0, 120);

  var leadId = String(payload.leadId || session.id);
  if (!taskCanChooseLead_(session, leadId)) {
    throw new Error('Нельзя назначить выбранного главного ответственного.');
  }

  var now = taskNowIso_();
  var task = {
    id: taskNewId_('T'),
    title: title,
    description: String(payload.description || '').trim().substring(0, 2500),
    project: String(payload.project || '').trim().substring(0, 90),
    createdBy: String(session.id),
    leadId: leadId,
    assigneeId: leadId,
    status: 'new',
    priority: ['low', 'normal', 'high'].indexOf(String(payload.priority)) !== -1
      ? String(payload.priority)
      : 'normal',
    dueDate: String(payload.dueDate || '').trim(),
    createdAt: now,
    updatedAt: now
  };

  var lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    taskSheet_().appendRow([
      task.id,
      task.title,
      task.description,
      task.project,
      task.createdBy,
      task.leadId,
      task.assigneeId,
      task.status,
      task.priority,
      task.dueDate,
      task.createdAt,
      task.updatedAt
    ]);

    appendTaskEvent_(
      task,
      session.id,
      'create',
      'Создано поручение. Главный ответственный: ' + getTaskUserDescriptor_(leadId).name +
      (task.dueDate ? '. Срок: ' + task.dueDate : '. Без срока.')
    );
  } finally {
    lock.releaseLock();
  }

  if (leadId !== String(session.id)) {
    notifyTaskUser_(
      leadId,
      '📌 Новая задача: ' + task.title +
      (task.dueDate ? '\nСрок: ' + task.dueDate : '\nБез срока.')
    );
  }

  return task;
}

function appGetTaskDetails(initData, taskId) {
  var session = getAppSession_(initData);
  var task = findTaskById_(taskId);

  if (!taskVisibleTo_(session, task)) {
    throw new Error('Нет доступа к этой задаче.');
  }

  return {
    task: task,
    events: readTaskEvents_(task.id)
  };
}

function appDelegateTask(initData, taskId, assigneeId, dueDate) {
  var session = getAppSession_(initData);
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    var task = findTaskById_(taskId);

    var manager =
      session.canManageTasks ||
      String(session.id) === String(task.leadId);

    if (!manager) {
      throw new Error('Делегировать задачу может её главный ответственный.');
    }

    var targetId = String(assigneeId || '').trim();
    if (!targetId) targetId = String(task.leadId);

    if (getCampusKnownUserIds_().indexOf(targetId) === -1) {
      throw new Error('Исполнитель не найден.');
    }

    if (!session.canManageTasks && !taskCanLeadDelegateTo_(task.leadId, targetId)) {
      throw new Error('Главе можно делегировать задачу только подчинённому своего сектора.');
    }

    task.assigneeId = targetId;
    task.dueDate = String(dueDate || '').trim();
    task.updatedAt = taskNowIso_();

    updateTaskRow_(task);

    appendTaskEvent_(
      task,
      session.id,
      'delegate',
      targetId === String(task.leadId)
        ? 'Исполнитель не выбран — задача остаётся за главным ответственным.' +
          (task.dueDate ? ' Срок: ' + task.dueDate : '')
        : 'Задача делегирована: ' + getTaskUserDescriptor_(targetId).name +
          '. Главный ответственный остаётся: ' + getTaskUserDescriptor_(task.leadId).name +
          (task.dueDate ? '. Срок: ' + task.dueDate : '')
    );

    if (targetId !== String(session.id)) {
      notifyTaskUser_(
        targetId,
        '📌 Вам делегирована задача: ' + task.title +
        (task.dueDate ? '\nСрок: ' + task.dueDate : '\nБез срока.')
      );
    }

    return task;
  } finally {
    lock.releaseLock();
  }
}

function appSetTaskStatus(initData, taskId, status) {
  var session = getAppSession_(initData);
  var allowed = ['new', 'in_progress', 'review', 'completed', 'cancelled'];
  status = String(status || '');

  if (allowed.indexOf(status) === -1) {
    throw new Error('Неизвестный статус.');
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    var task = findTaskById_(taskId);
    var self = String(session.id);
    var manager =
      session.canManageTasks ||
      self === String(task.leadId);
    var executor = self === String(task.assigneeId);

    if (!manager && !executor) {
      throw new Error('Недостаточно прав для изменения статуса.');
    }

    if (!manager && executor && ['in_progress', 'review'].indexOf(status) === -1) {
      throw new Error('Исполнитель может перевести задачу только «В работу» или «На проверку».');
    }

    task.status = status;
    task.updatedAt = taskNowIso_();
    updateTaskRow_(task);

    appendTaskEvent_(task, session.id, 'status', 'Статус изменён: ' + status);
    return task;
  } finally {
    lock.releaseLock();
  }
}

function appCommentTask(initData, taskId, text) {
  var session = getAppSession_(initData);
  text = String(text || '').trim();

  if (!text) throw new Error('Комментарий пустой.');
  if (text.length > 900) text = text.substring(0, 900);

  var task = findTaskById_(taskId);
  if (!taskVisibleTo_(session, task)) {
    throw new Error('Нет доступа к этой задаче.');
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    appendTaskEvent_(task, session.id, 'comment', text);
  } finally {
    lock.releaseLock();
  }

  return { ok: true };
}

function appGetTaskFeed(initData) {
  var session = getAppSession_(initData);
  var visible = {};
  var tasks = readAllTasks_();

  tasks.forEach(function(task) {
    if (taskVisibleTo_(session, task)) visible[task.id] = task;
  });

  var sheet = taskEventSheet_();
  if (sheet.getLastRow() < 2) return [];

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getDisplayValues();
  var result = [];

  values.forEach(function(row) {
    var taskId = String(row[1] || '');
    var task = visible[taskId];
    if (!task) return;

    result.push({
      id: String(row[0] || ''),
      taskId: taskId,
      taskTitle: task.title,
      at: String(row[2] || ''),
      userId: String(row[3] || ''),
      type: String(row[4] || ''),
      text: String(row[5] || '')
    });
  });

  result.sort(function(a, b) {
    return String(b.at).localeCompare(String(a.at));
  });

  return result.slice(0, 150);
}
