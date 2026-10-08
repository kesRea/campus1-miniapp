/** Campus AI V14 — confirmed actions
 * AI assistant for Campus №1. Write actions are never executed without explicit confirmation.
 * OPENAI_API_KEY and optional OPENAI_MODEL are read from Script Properties.
 */

function appAIStatus(initData) {
  getAppSession_(initData);
  const props = PropertiesService.getScriptProperties();
  const configured = !!String(props.getProperty('OPENAI_API_KEY') || '').trim();
  const configuredModel = normalizeCampusAIModel_(props.getProperty('OPENAI_MODEL'));
  return {
    configured: configured,
    provider: configured ? 'OpenAI' : 'Campus Local',
    model: configured ? configuredModel : 'local',
    mode: configured ? 'ai' : 'local',
    readOnly: false, actions: true, writeRequiresConfirmation: true,
    version: '14.0.0'
  };
}

function normalizeCampusAIModel_(model) {
  model = String(model || '').trim();
  const allowed = ['gpt-6-luna', 'gpt-6-sol', 'gpt-5.6-sol'];
  return allowed.indexOf(model) !== -1 ? model : 'gpt-6-luna';
}

function appSetAIConfig(initData, apiKey, model) {
  const session = getAppSession_(initData);
  if (!session.isOwner) throw new Error('Настройки ИИ доступны только владельцу.');

  apiKey = String(apiKey || '').trim();
  model = String(model || 'gpt-6-luna').trim();

  if (!/^sk-[A-Za-z0-9_-]{20,}$/.test(apiKey)) {
    throw new Error('Похоже, API-ключ введён неверно.');
  }

  const allowedModels = ['gpt-6-luna', 'gpt-6-sol', 'gpt-5.6-sol'];
  if (allowedModels.indexOf(model) === -1) model = 'gpt-6-luna';

  const props = PropertiesService.getScriptProperties();
  props.setProperty('OPENAI_API_KEY', apiKey);
  props.setProperty('OPENAI_MODEL', model);

  return { configured: true, provider: 'OpenAI', model: model, mode: 'ai', readOnly: false, actions: true, writeRequiresConfirmation: true, version: '14.0.0' };
}

function appClearAIConfig(initData) {
  const session = getAppSession_(initData);
  if (!session.isOwner) throw new Error('Настройки ИИ доступны только владельцу.');
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty('OPENAI_API_KEY');
  props.deleteProperty('OPENAI_MODEL');
  return { configured: false, provider: 'Campus Local', model: 'local', mode: 'local', readOnly: false, actions: true, writeRequiresConfirmation: true, version: '14.0.0' };
}

function appAskAI(initData, prompt, history) {
  const session = getAppSession_(initData);
  prompt = String(prompt || '').trim();
  if (!prompt) throw new Error('Введите вопрос.');
  if (prompt.length > 4000) throw new Error('Вопрос слишком длинный. Сократите его до 4000 символов.');

  const actionPlan = tryCampusActionPlanV14_(prompt, session);
  if (actionPlan) return actionPlan;

  const local = tryCampusLocalAnswerV11_(prompt, history);
  if (local) return { source: 'campus', text: local, model: 'local' };

  const props = PropertiesService.getScriptProperties();
  const apiKey = String(props.getProperty('OPENAI_API_KEY') || '').trim();
  if (!apiKey) {
    return {
      source: 'local',
      model: 'local',
      text: 'По базе Campus №1 я уже умею отвечать локально: комнаты, поиск студентов, заселение и статистика. Для генерации объявлений, документов и свободного диалога нужно один раз добавить OPENAI_API_KEY в Script Properties.'
    };
  }

  const model = normalizeCampusAIModel_(props.getProperty('OPENAI_MODEL'));
  const context = buildCampusAIContextV11_(prompt, session);
  const safeHistory = sanitizeAIHistoryV11_(history);

  const input = [];
  safeHistory.forEach(function(item) {
    input.push({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: [{ type: 'input_text', text: item.text }]
    });
  });
  input.push({
    role: 'user',
    content: [{ type: 'input_text', text: prompt }]
  });

  const instructions = [
    'Ты Campus AI — внутренний помощник Campus №1 Toraighyrov University.',
    'Отвечай на языке пользователя. Пиши понятно, конкретно и без канцелярита.',
    'Используй только CAMPUS_CONTEXT для фактов о студентах, комнатах и статистике.',
    'Если данных недостаточно — прямо скажи, каких данных не хватает.',
    'Не придумывай ФИО, комнаты, статусы, даты, оплаты или другие записи базы.',
    'Не проси ИИН или паспорт без необходимости и не повторяй такие данные в ответе.',
    'Ты сам никогда не изменяешь базу и не утверждаешь, что действие уже выполнено.',
    'Переселение и выселение выполняются только через подтверждаемую карточку действия, которую формирует сервер Campus №1.',
    'Для объявлений и документов сразу выдавай готовый текст без лишнего вступления.',
    'Если просят русский/казахский/английский — разделяй версии понятными заголовками.',
    '',
    'CAMPUS_CONTEXT:',
    JSON.stringify(context)
  ].join('\n');

  const body = {
    model: model,
    instructions: instructions,
    input: input,
    store: false,
    max_output_tokens: 1200
  };

  const response = UrlFetchApp.fetch('https://api.openai.com/v1/responses', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + apiKey },
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  const raw = response.getContentText();
  if (status < 200 || status >= 300) {
    let detail = raw.substring(0, 500);
    try {
      const err = JSON.parse(raw);
      detail = err && err.error && err.error.message ? err.error.message : detail;
    } catch (ignore) {}
    throw new Error('Campus AI: OpenAI API ' + status + '. ' + detail);
  }

  const data = JSON.parse(raw);
  const text = extractOpenAITextV11_(data);
  if (!text) throw new Error('Campus AI не получил текстовый ответ.');

  return {
    source: 'openai',
    model: data.model || model,
    text: text
  };
}

function sanitizeAIHistoryV11_(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(function(x) {
      return x && (x.role === 'user' || x.role === 'assistant' || x.role === 'bot') && String(x.text || '').trim();
    })
    .slice(-8)
    .map(function(x) {
      return {
        role: x.role === 'user' ? 'user' : 'assistant',
        text: String(x.text || '').trim().substring(0, 2500)
      };
    });
}

function buildCampusAIContextV11_(prompt, session) {
  const dashboard = buildDashboard_();
  const analytics = buildAnalytics_();
  const p = String(prompt || '').toLowerCase();
  const context = {
    campus: 'Campus №1',
    user: { role: session.role || 'Пользователь', canManage: !!session.canManage },
    dashboard: dashboard,
    recentAnalytics: analytics && analytics.months ? analytics.months : [],
    occupancyDistribution: analytics && analytics.distribution ? analytics.distribution : {},
    privacy: 'ИИН/паспорт не передаются модели.',
    relevantRooms: [],
    relevantStudents: []
  };

  const roomNumbers = [];
  const roomRe = /(?:комнат(?:а|е|ы|у)?|room|№)\s*№?\s*(\d{1,3})/ig;
  let rm;
  while ((rm = roomRe.exec(prompt)) && roomNumbers.length < 5) {
    if (roomNumbers.indexOf(String(rm[1])) === -1) roomNumbers.push(String(rm[1]));
  }
  roomNumbers.forEach(function(room) {
    if (getCampusRooms_().map(String).indexOf(room) === -1) return;
    const occupants = getCurrentStudents_().filter(function(s) { return s.room === room; });
    context.relevantRooms.push({
      room: room,
      occupants: occupants.map(function(s) {
        return { fio: s.fio, faculty: s.faculty || '' };
      })
    });
  });

  if (/свободн.*комнат|free room/i.test(p)) {
    context.freeRooms = appGetRoomsLocal_().filter(function(r) { return r.occupants === 0; }).map(function(r) { return r.room; });
  }

  const students = getCurrentStudents_();
  const words = p
    .replace(/[^a-zа-яёәіңғүұқөһ0-9\- ]/gi, ' ')
    .split(/\s+/)
    .filter(function(w) { return w.length >= 4; })
    .filter(function(w) {
      return ['найди','студент','студента','студенты','комната','комнате','комнаты','проживает','проживают','покажи','который','которая','какие','сколько','сейчас','campus'].indexOf(w) === -1;
    });

  if (words.length) {
    const hits = students.filter(function(s) {
      const hay = (s.fio + ' ' + s.faculty + ' ' + s.room).toLowerCase();
      return words.some(function(w) { return hay.indexOf(w) !== -1; });
    }).slice(0, 12);

    context.relevantStudents = hits.map(function(s) {
      return {
        fio: s.fio,
        room: s.room,
        faculty: s.faculty || '',
        dateIn: s.dateIn || ''
      };
    });
  }

  return context;
}

function tryCampusLocalAnswerV11_(prompt, history) {
  const p = String(prompt || '').toLowerCase().trim();
  const rooms = getCampusRooms_().map(String);
  const current = getCurrentStudents_();

  const roomMatch = p.match(/(?:комнат(?:а|е|ы|у)?|room|№)\s*№?\s*(\d{1,3})/i);
  if (roomMatch) {
    const room = String(roomMatch[1]);
    if (rooms.indexOf(room) !== -1 && /(кто|прожив|жив|студент|комнат|сколько)/i.test(p)) {
      const list = current.filter(function(s) { return s.room === room; });
      if (!list.length) return 'Комната №' + room + ' сейчас свободна.';
      return 'Комната №' + room + ' — ' + list.length + ' проживающих:\n' + list.map(function(s, i) {
        return (i + 1) + '. ' + s.fio + (s.faculty ? ' — ' + s.faculty : '');
      }).join('\n');
    }
  }

  if (/(сколько|общее|всего).*(заселен|прожив|студент)/i.test(p)) {
    const d = buildDashboard_();
    return [
      'Сейчас заселено: ' + d.currentStudents + '.',
      'Всего записей студентов: ' + d.totalStudents + '.',
      'Занято комнат: ' + d.occupiedRooms + ' из ' + d.totalRooms + '.',
      'Свободно комнат: ' + d.freeRooms + '.'
    ].join('\n');
  }

  if (/свободн.*комнат|какие.*комнат.*свобод/i.test(p)) {
    const free = appGetRoomsLocal_().filter(function(r) { return r.occupants === 0; }).map(function(r) { return r.room; });
    return free.length ? 'Свободные комнаты (' + free.length + '): ' + free.join(', ') + '.' : 'Свободных комнат по текущей базе не найдено.';
  }

  if (/иностран/i.test(p) && /(сколько|всего)/i.test(p)) {
    return 'В списке иностранных студентов: ' + readOptionalTable_('foreigners').rows.length + '.';
  }

  if (/^(найди|покажи|где|кто такой|кто такая)\b/i.test(p) || /найди.*студент/i.test(p)) {
    const query = p
      .replace(/^(найди|покажи|где|кто такой|кто такая)\s+/i, '')
      .replace(/\b(студента?|по базе|в базе|campus)\b/ig, ' ')
      .trim();

    if (query.length >= 3) {
      const words = query.split(/\s+/).filter(function(w) { return w.length >= 3; });
      const hits = current.filter(function(s) {
        const hay = (s.fio + ' ' + s.faculty + ' ' + s.room).toLowerCase();
        return words.every(function(w) { return hay.indexOf(w) !== -1; });
      }).slice(0, 10);

      if (hits.length) {
        return 'Найдено: ' + hits.length + '\n' + hits.map(function(s, i) {
          return (i + 1) + '. ' + s.fio + ' — комната ' + (s.room || '—') + (s.faculty ? ', ' + s.faculty : '');
        }).join('\n');
      }
    }
  }

  return '';
}



function campusActionStemV14_(word) {
  word = String(word || '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-яәіңғүұқөһ-]/gi, '');
  if (word.length <= 4) return word;
  const endings = ['иями','ями','ами','ого','ему','ому','ова','ева','ина','ына','ной','кой','ой','ей','ам','ям','ах','ях','ов','ев','ин','ын','а','я','у','ю','ы','и','е'];
  for (let i = 0; i < endings.length; i++) {
    const e = endings[i];
    if (word.length - e.length >= 4 && word.slice(-e.length) === e) return word.slice(0, -e.length);
  }
  return word;
}

function campusActionTokensV14_(prompt, targetRoom) {
  const stop = {
    'подготовь':1,'подготовить':1,'переселение':1,'пересели':1,'переселить':1,'переселите':1,
    'перемести':1,'переместить':1,'переведи':1,'перевести':1,'высели':1,'выселить':1,'выселение':1,
    'студента':1,'студент':1,'студентку':1,'человека':1,'из':1,'в':1,'на':1,'комнату':1,'комната':1,
    'комнаты':1,'комнате':1,'комнату':1,'номер':1,'room':1,'move':1,'evict':1,'to':1,'from':1,
    'пожалуйста':1,'нужно':1,'надо':1,'хочу':1
  };

  return String(prompt || '')
    .toLowerCase()
    .replace(/ё/g,'е')
    .replace(/№/g,' ')
    .replace(/[^a-zа-яәіңғүұқөһ0-9\- ]/gi,' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter(function(w) { return !/^\d+$/.test(w); })
    .filter(function(w) { return !stop[w]; })
    .map(campusActionStemV14_)
    .filter(function(w) { return w.length >= 3; });
}

function findCampusActionStudentsV14_(prompt, targetRoom) {
  const tokens = campusActionTokensV14_(prompt, targetRoom);
  if (!tokens.length) return [];

  return getCurrentStudents_().filter(function(s) {
    const studentWords = String(s.fio || '')
      .toLowerCase()
      .replace(/ё/g,'е')
      .split(/\s+/)
      .map(campusActionStemV14_);

    return tokens.every(function(token) {
      return studentWords.some(function(sw) {
        return sw.indexOf(token) === 0 || token.indexOf(sw) === 0;
      });
    });
  }).slice(0, 8);
}

function formatCampusActionCandidatesV14_(hits) {
  return hits.map(function(s, i) {
    return (i + 1) + '. ' + s.fio + ' — комната ' + (s.room || '—') + (s.faculty ? ', ' + s.faculty : '');
  }).join('\n');
}

function tryCampusActionPlanV14_(prompt, session) {
  const p = String(prompt || '').toLowerCase();
  const wantsMove = /(пересел|перемест|перевед.*комнат|move\b)/i.test(p);
  const wantsEvict = /(высел|evict\b)/i.test(p);

  if (!wantsMove && !wantsEvict) return null;

  if (!session.canManage) {
    return {
      source: 'campus',
      model: 'local',
      text: 'Для переселения или выселения нужны права управления студентами. Текущая роль не позволяет изменять базу.'
    };
  }

  let targetRoom = '';
  if (wantsMove) {
    let m = String(prompt).match(/(?:\bв\b|\bto\b)\s*(?:комнат(?:у|а|е|ы)?\s*)?№?\s*(\d{1,3})\b/i);
    if (!m) m = String(prompt).match(/(?:нов(?:ая|ую)\s+комнат(?:а|у)|комнат(?:а|у))\s*№?\s*(\d{1,3})\s*$/i);
    targetRoom = m ? String(m[1]) : '';

    if (!targetRoom) {
      return { source:'campus', model:'local', text:'Укажите новую комнату. Например: «Подготовь переселение Иванова в комнату 150».' };
    }

    if (getCampusRooms_().map(String).indexOf(targetRoom) === -1) {
      return { source:'campus', model:'local', text:'Комнаты №' + targetRoom + ' нет в списке Campus №1.' };
    }
  }

  const hits = findCampusActionStudentsV14_(prompt, targetRoom);

  if (!hits.length) {
    return {
      source:'campus',
      model:'local',
      text:'Не удалось однозначно найти студента по этой команде. Укажите ФИО точнее.'
    };
  }

  if (hits.length > 1) {
    return {
      source:'campus',
      model:'local',
      text:'Нашлось несколько подходящих студентов. Уточните ФИО:\n' + formatCampusActionCandidatesV14_(hits)
    };
  }

  const student = hits[0];

  if (wantsMove && String(student.room) === targetRoom) {
    return {
      source:'campus',
      model:'local',
      text: student.fio + ' уже находится в комнате №' + targetRoom + '.'
    };
  }

  const action = wantsMove ? {
    type:'move',
    rowNumber:student.rowNumber,
    student:student.fio,
    faculty:student.faculty || '',
    fromRoom:String(student.room || ''),
    toRoom:targetRoom
  } : {
    type:'evict',
    rowNumber:student.rowNumber,
    student:student.fio,
    faculty:student.faculty || '',
    fromRoom:String(student.room || '')
  };

  return {
    source:'campus',
    model:'local',
    text:wantsMove
      ? 'Действие подготовлено. Проверьте студента и комнаты, затем нажмите «Подтвердить».'
      : 'Выселение подготовлено. Проверьте студента и текущую комнату, затем нажмите «Подтвердить».',
    action:action
  };
}

function appExecuteAIAction(initData, action) {
  const session = getAppSession_(initData);
  requireManage_(session);

  action = action || {};
  const type = String(action.type || '');
  const rowNumber = Number(action.rowNumber);
  const expectedRoom = String(action.expectedRoom || '').trim();
  const toRoom = String(action.toRoom || '').trim();

  if (type !== 'move' && type !== 'evict') throw new Error('Недопустимый тип AI-действия.');

  const sheet = getStudentSheet_();
  if (!rowNumber || rowNumber < 2 || rowNumber > sheet.getLastRow()) throw new Error('Запись студента больше не существует.');

  const current = mapStudentRow_(sheet.getRange(rowNumber, 1, 1, 10).getDisplayValues()[0], rowNumber);
  if (!current.fio) throw new Error('Студент больше не найден.');
  if (!current.active) throw new Error('Студент уже выселен.');

  if (expectedRoom && String(current.room || '') !== expectedRoom) {
    throw new Error('Данные изменились: сейчас студент находится в комнате №' + (current.room || '—') + '. Обновите команду Campus AI.');
  }

  if (type === 'move') {
    if (getCampusRooms_().map(String).indexOf(toRoom) === -1) throw new Error('Такой комнаты нет в Campus №1.');
    if (toRoom === String(current.room || '')) throw new Error('Студент уже находится в этой комнате.');

    appMoveStudent(initData, rowNumber, toRoom);
    return {
      ok:true,
      type:'move',
      message:current.fio + ' переселён: ' + current.room + ' → ' + toRoom + '.'
    };
  }

  appEvictStudent(initData, rowNumber);
  return {
    ok:true,
    type:'evict',
    message:current.fio + ' выселен из комнаты №' + (current.room || '—') + '.'
  };
}

function appGetRoomsLocal_() {
  const students = getCurrentStudents_();
  const counts = {};
  students.forEach(function(s) { counts[s.room] = (counts[s.room] || 0) + 1; });
  return getCampusRooms_().map(function(r) { return { room: String(r), occupants: counts[String(r)] || 0 }; });
}

function extractOpenAITextV11_(data) {
  if (data && data.output_text) return String(data.output_text).trim();
  const out = [];
  (data && data.output || []).forEach(function(item) {
    (item.content || []).forEach(function(c) {
      if (c && c.type === 'output_text' && c.text) out.push(String(c.text));
      else if (c && c.text) out.push(String(c.text));
    });
  });
  return out.join('\n').trim();
}
