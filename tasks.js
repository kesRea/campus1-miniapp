/* CAMPUS_TASKS_UI_V13_9 — all tasks are stored on backend, not in browser. */
const taskUI={tab:'tasks',filter:'active',items:[],users:[],ready:false,selectedDate:'',calendarMonth:new Date().getMonth(),calendarYear:new Date().getFullYear(),project:''};
const TASK_STATUS={new:'Новая',in_progress:'В работе',review:'На проверке',completed:'Выполнено',cancelled:'Отменено'};
const TASK_PRIORITY={low:'Низкий',normal:'Обычный',high:'Срочно'};

function taskName(id){return taskUI.users.find(u=>String(u.id)===String(id))?.name||'Участник '+String(id||'');}
function taskDay(v){if(!v)return 'Без срока';const a=String(v).split('-');return a.length===3?`${a[2]}.${a[1]}.${a[0]}`:String(v);}
function taskStamp(v){if(!v)return '';const d=new Date(v);return isNaN(+d)?String(v):d.toLocaleString('ru-RU',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});}
function taskToday(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function taskOverdue(t){return t.dueDate&&t.dueDate<taskToday()&&!['completed','cancelled'].includes(t.status);}
function taskTabs(){return [['tasks','Задачи'],['projects','Проекты'],['streams','Потоки'],['templates','Шаблоны'],['calendar','Календарь']].map(([k,v])=>`<button class="task-tab ${taskUI.tab===k?'selected':''}" onclick="selectTaskTab('${k}')">${v}</button>`).join('');}
function taskSafeArg(v){return encodeURIComponent(String(v)).replace(/'/g,'%27');}
function taskHeader(){return `${pageHead('Задачи и проекты','home')}<div class="task-tagline">Поручения, делегирование и контроль сроков</div><div class="task-tabs">${taskTabs()}</div>`;}
function taskCounts(){const a=taskUI.items;return `<div class="task-summary"><div><strong>${a.filter(t=>!['completed','cancelled'].includes(t.status)).length}</strong><span>Активных</span></div><div><strong>${a.filter(t=>t.assigneeId===String(state.user?.id)&&!['completed','cancelled'].includes(t.status)).length}</strong><span>Мне</span></div><div><strong>${a.filter(taskOverdue).length}</strong><span>Просрочено</span></div></div>`;}
function taskCard(t){
 const status=TASK_STATUS[t.status]||'Новая',expired=taskOverdue(t);
 return `<button class="task-item" type="button" onclick="openTask('${esc(t.id)}')">
   <div class="task-item-top"><span class="task-bullet ${t.status||'new'}"></span><strong>${esc(t.title)}</strong><span class="task-status status-${esc(t.status)}">${esc(status)}</span></div>
   ${t.description?`<p>${esc(t.description)}</p>`:''}
   <div class="task-item-meta">${t.project?`<span>▦ ${esc(t.project)}</span>`:''}<span>👤 ${esc(taskName(t.assigneeId))}</span><span class="${expired?'task-late':''}">◷ ${esc(taskDay(t.dueDate))}</span></div>
 </button>`;
}
function selectTaskTab(tab){taskUI.tab=tab;taskUI.project='';haptic('light');drawTaskCenter();}
function selectTaskFilter(filter){taskUI.filter=filter;drawTaskCenter();}
function taskVisibleItems(){const id=String(state.user?.id),f=taskUI.filter;return taskUI.items.filter(t=>f==='active'?!['completed','cancelled'].includes(t.status):f==='mine'?t.assigneeId===id:f==='issued'?t.createdBy===id||t.leadId===id:f==='done'?['completed','cancelled'].includes(t.status):true);}
async function renderTasks(){
 if(taskUI.tab==='projects-detail')taskUI.tab='projects';
 $('#view').innerHTML=taskHeader()+'<div class="task-center-loading">Загружаем задачи…</div>';
 try{
   const result=await Promise.all([apiRequest('appGetTasks',[state.initData],{ttl:0,force:true}),apiRequest('appGetTaskUsers',[state.initData],{ttl:30000})]);
   taskUI.items=result[0]||[];taskUI.users=result[1]||[];taskUI.ready=true;
   if(state.currentPage==='tasks')drawTaskCenter();
 }catch(e){if(state.currentPage==='tasks')$('#view').innerHTML=taskHeader()+`<div class="task-empty"><b>Не получилось загрузить задачи</b><p>${esc(e.message)}</p><button class="btn btn-primary" onclick="render('tasks')">Повторить</button></div>`;}
}
function drawTaskCenter(){
 if(state.currentPage!=='tasks')return;
 const add=canManage()?`<button class="task-fab" type="button" onclick="openTaskCreate()" aria-label="Создать задачу">+</button>`:'';
 const base=taskHeader()+taskCounts();
 let inner='';
 if(taskUI.tab==='tasks'){
  const fs=[['active','В работе'],['mine','Назначены мне'],['issued','Поручено мной'],['done','Завершённые']];
  const list=taskVisibleItems();
  inner=`<div class="task-filters">${fs.map(([k,v])=>`<button class="task-filter ${taskUI.filter===k?'selected':''}" onclick="selectTaskFilter('${k}')">${v}</button>`).join('')}</div>
    ${list.length?`<div class="task-list">${list.map(taskCard).join('')}</div>`:'<div class="task-empty"><div class="task-empty-illustration">☑</div><b>Задач пока нет</b><p>Создавайте поручения, назначайте ответственных и следите за сроками.</p></div>'}`;
 }else if(taskUI.tab==='projects'){
   const map=new Map();taskUI.items.forEach(t=>{const p=t.project||'Без проекта'; if(!map.has(p))map.set(p,[]);map.get(p).push(t);});
   inner=map.size?`<div class="task-list">${[...map.entries()].map(([p,ts])=>`<button class="task-project" onclick="openTaskProject('${taskSafeArg(p)}')"><span class="task-project-icon">▦</span><span><b>${esc(p)}</b><small>${ts.length} задач · ${ts.filter(t=>t.status==='completed').length} выполнено</small></span><span>›</span></button>`).join('')}</div>`:'<div class="task-empty"><b>Проектов пока нет</b><p>Укажите проект при создании поручения — задачи будут собраны здесь.</p></div>';
 }else if(taskUI.tab==='streams'){
  inner='<div class="task-center-loading">Загружаем протокол действий…</div>';
 }else if(taskUI.tab==='templates'){
  inner=`<div class="task-list">
   ${[['Поручение','Стандартная задача','normal'],['Срочная задача','Задача с высоким приоритетом','high'],['Проверка комнаты','Проверка состояния комнаты','normal'],['Подготовка документа','Подготовка документа для администрации','normal']].map(([title,sub,priority])=>`<button class="task-template" onclick="openTaskCreate('${encodeURIComponent(title)}','${priority}')"><span class="task-project-icon">☷</span><span><b>${esc(title)}</b><small>${esc(sub)}</small></span><span>+</span></button>`).join('')}
  </div>`;
 }else if(taskUI.tab==='calendar')inner=taskCalendarHtml();
 $('#view').innerHTML=base+inner+add;
 if(taskUI.tab==='streams')loadTaskFeed();
}
function openTaskProject(name){taskUI.project=decodeURIComponent(name);taskUI.tab='projects-detail';renderTaskProject();}
function renderTaskProject(){
 $('#view').innerHTML=pageHead(taskUI.project,'tasks')+`<div class="task-list">${taskUI.items.filter(t=>(t.project||'Без проекта')===taskUI.project).map(taskCard).join('')}</div>`;
}
async function loadTaskFeed(){
 try{const feed=await apiRequest('appGetTaskFeed',[state.initData],{ttl:0,force:true});if(state.currentPage!=='tasks'||taskUI.tab!=='streams')return;
 const content=feed.length?`<div class="task-list">${feed.map(e=>`<button class="task-event" onclick="openTask('${esc(e.taskId)}')"><b>${esc(e.taskTitle)}</b><small>${esc(taskStamp(e.at))} · ${esc(taskName(e.userId))}</small><span>${esc(e.text)}</span></button>`).join('')}</div>`:'<div class="task-empty"><b>Поток событий пуст</b><p>Здесь появятся создания, делегирования, статусы и комментарии.</p></div>';
 const loading=$('.task-center-loading');if(loading)loading.outerHTML=content;
 }catch(e){const loading=$('.task-center-loading');if(loading)loading.outerHTML=`<div class="task-empty">${esc(e.message)}</div>`;}
}
function taskMonthMove(delta){let d=new Date(taskUI.calendarYear,taskUI.calendarMonth+delta,1);taskUI.calendarYear=d.getFullYear();taskUI.calendarMonth=d.getMonth();drawTaskCenter();}
function taskCalendarHtml(){
 const y=taskUI.calendarYear,m=taskUI.calendarMonth,first=(new Date(y,m,1).getDay()+6)%7,n=new Date(y,m+1,0).getDate(),today=taskToday();
 const title=new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric'}).format(new Date(y,m,1));
 const days=Array.from({length:first},()=>'<span class="task-cal-blank"></span>');
 for(let k=1;k<=n;k++){
  const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(k).padStart(2,'0')}`,due=taskUI.items.some(t=>t.dueDate===iso);
  days.push(`<button class="task-cal-day ${taskUI.selectedDate===iso?'chosen':''} ${today===iso?'today':''}" onclick="taskSelectDate('${iso}')">${k}${due?'<i></i>':''}</button>`);
 }
 const list=taskUI.items.filter(t=>t.dueDate===taskUI.selectedDate);
 return `<div class="task-calendar"><div class="task-month"><strong>${esc(title)}</strong><span><button onclick="taskMonthMove(-1)">‹</button><button onclick="taskMonthMove(1)">›</button></span></div>
  <div class="task-cal-grid">${['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].map(d=>`<span class="task-weekday">${d}</span>`).join('')}${days.join('')}</div></div>
  <div class="section-heading"><h2>${taskUI.selectedDate?'Задачи на '+taskDay(taskUI.selectedDate):'Выберите день со сроком'}</h2></div>
  ${taskUI.selectedDate?(list.length?`<div class="task-list">${list.map(taskCard).join('')}</div>`:'<div class="task-empty compact">На этот день задач нет.</div>'):''}`;
}
function taskSelectDate(iso){taskUI.selectedDate=iso;drawTaskCenter();}
function taskUserOptions(selected,emptyTitle){return `${emptyTitle?`<option value="">${esc(emptyTitle)}</option>`:''}${taskUI.users.map(u=>`<option value="${esc(u.id)}" ${String(u.id)===String(selected)?'selected':''}>${esc(u.name)}${u.role&&u.role!=='Без роли'?' — '+esc(u.role):''}</option>`).join('')}`;}
function openTaskCreate(titleEncoded='',priority='normal'){
 if(!canManage())return toast('Создавать задачи может администрация');
 const title=titleEncoded?decodeURIComponent(titleEncoded):'';
 const self=String(state.user?.id||'');
 showModal(`<div class="sheet-handle"></div><h3>Новое поручение</h3>
   <div class="field"><label>Название задачи *</label><input id="task_title" maxlength="120" value="${esc(title)}" placeholder="Что нужно сделать?"></div>
   <div class="field"><label>Описание</label><textarea id="task_desc" rows="4" maxlength="2500" placeholder="Подробности поручения"></textarea></div>
   <div class="field"><label>Проект (необязательно)</label><input id="task_project" maxlength="90" placeholder="Например: Документация"></div>
   <div class="field"><label>Главный ответственный / глава</label><select id="task_lead">${taskUserOptions(self)}</select><small class="task-hint">Именно глава будет отвечать за задачу, даже если делегирует её.</small></div>
   <div class="field"><label>Приоритет</label><select id="task_priority"><option value="normal" ${priority==='normal'?'selected':''}>Обычный</option><option value="high" ${priority==='high'?'selected':''}>Срочный</option><option value="low">Низкий</option></select></div>
   <div class="task-bottom-deadline"><label>📅 Срок выполнения</label><input type="date" id="task_due"></div>
   <button class="btn btn-primary btn-wide" id="task_create_btn" onclick="submitTaskCreate()">Создать задачу</button><button class="btn btn-secondary btn-wide" onclick="closeModal()">Отмена</button>`);
}
async function submitTaskCreate(){
 const data={title:$('#task_title')?.value.trim(),description:$('#task_desc')?.value.trim(),project:$('#task_project')?.value.trim(),leadId:$('#task_lead')?.value,priority:$('#task_priority')?.value,dueDate:$('#task_due')?.value};
 if(!data.title)return toast('Введите название задачи');
 const btn=$('#task_create_btn');if(btn)btn.disabled=true;
 try{await apiRequest('appCreateTask',[state.initData,data],{ttl:0,force:true});closeModal();toast('Поручение создано');taskUI.tab='tasks';await renderTasks();}
 catch(e){toast(e.message);if(btn)btn.disabled=false;}
}
async function openTask(id){
 state.currentPage='task-detail';state.renderSeq++;setNav('tasks');$('#view').innerHTML=pageHead('Поручение','tasks')+'<div class="task-center-loading">Открываем поручение…</div>';
 try{const result=await apiRequest('appGetTaskDetails',[state.initData,id],{ttl:0,force:true});if(state.currentPage!=='task-detail')return;drawTaskDetail(result.task,result.events);}
 catch(e){if(state.currentPage==='task-detail')$('#view').innerHTML=pageHead('Задача','tasks')+`<div class="task-empty">${esc(e.message)}</div>`;}
}
function drawTaskDetail(t,events){
 const self=String(state.user?.id),manager=!!state.user?.isOwner||self===t.leadId||self===t.createdBy,executor=t.assigneeId===self;
 const statusBtns=manager?['new','in_progress','review','completed','cancelled']:executor?['in_progress','review']:[];
 $('#view').innerHTML=`${pageHead('Поручение','tasks')}
 <article class="task-detail-card"><div class="task-detail-tags"><span class="task-status status-${esc(t.status)}">${esc(TASK_STATUS[t.status]||t.status)}</span><span class="task-priority ${t.priority==='high'?'high':''}">${esc(TASK_PRIORITY[t.priority]||'Обычный')}</span></div>
 <h2>${esc(t.title)}</h2>${t.description?`<p>${esc(t.description)}</p>`:''}
 <div class="task-kv"><div><small>Поручил</small><b>${esc(taskName(t.createdBy))}</b></div><div><small>Главный руководитель</small><b>${esc(taskName(t.leadId))}</b></div><div><small>Ответственный</small><b>${esc(taskName(t.assigneeId))}</b></div><div><small>Срок</small><b class="${taskOverdue(t)?'task-late':''}">${esc(taskDay(t.dueDate))}</b></div>${t.project?`<div><small>Проект</small><b>${esc(t.project)}</b></div>`:''}</div>
 </article>
 ${manager?`<button class="btn btn-primary btn-wide" onclick="openTaskDelegate('${esc(t.id)}','${esc(t.assigneeId)}','${esc(t.dueDate)}')">⇄ Делегировать / изменить срок</button>`:''}
 ${statusBtns.length?`<div class="section-heading"><h2>Изменить статус</h2></div><div class="task-status-actions">${statusBtns.map(s=>`<button class="task-status-btn ${s===t.status?'current':''}" ${s===t.status?'disabled':''} onclick="taskChangeStatus('${esc(t.id)}','${s}')">${esc(TASK_STATUS[s])}</button>`).join('')}</div>`:''}
 <div class="section-heading"><h2>Протокол действий</h2></div><div class="task-timeline">${(events||[]).length?(events||[]).map(e=>`<div class="task-timeline-entry"><span class="task-event-dot"></span><div><b>${esc(taskName(e.userId))}</b><small>${esc(taskStamp(e.at))}</small><p>${esc(e.text)}</p></div></div>`).join(''):'<div class="task-empty compact">История пуста</div>'}</div>
 <div class="field task-comment"><label>Комментарий</label><textarea id="task_comment" maxlength="900" rows="2" placeholder="Добавить запись в протокол…"></textarea><button class="btn btn-primary btn-wide" onclick="taskSendComment('${esc(t.id)}')">Отправить</button></div>`;
}
function openTaskDelegate(id,assigneeId,due){
 const task=taskUI.items.find(t=>t.id===id);if(!task)return;
 showModal(`<div class="sheet-handle"></div><h3>Делегировать задачу</h3><p class="task-muted">Главный руководитель: <b>${esc(taskName(task.leadId))}</b>. Он остаётся ответственным за результат.</p>
   <div class="field"><label>Исполнитель (подчинённый)</label><select id="task_delegate_user"><option value="">Не выбирать — оставить главу</option>${taskUserOptions(assigneeId)}</select><small class="task-hint">Если оставить пустым, выполнение остаётся за главным руководителем.</small></div>
   <div class="task-bottom-deadline"><label>📅 Срок выполнения</label><input type="date" id="task_delegate_due" value="${esc(due||'')}"></div>
   <button class="btn btn-primary btn-wide" id="task_delegate_btn" onclick="submitTaskDelegate('${esc(id)}')">Сохранить делегирование</button><button class="btn btn-secondary btn-wide" onclick="closeModal()">Отмена</button>`);
 $('#task_delegate_user').value=assigneeId===task.leadId?'':assigneeId;
}
async function submitTaskDelegate(id){const btn=$('#task_delegate_btn');if(btn)btn.disabled=true;
 try{await apiRequest('appDelegateTask',[state.initData,id,$('#task_delegate_user').value,$('#task_delegate_due').value],{ttl:0,force:true});closeModal();toast('Назначение сохранено');await renderTasksSilently();openTask(id);}
 catch(e){toast(e.message);if(btn)btn.disabled=false;}
}
async function renderTasksSilently(){try{taskUI.items=await apiRequest('appGetTasks',[state.initData],{ttl:0,force:true})}catch(e){}}
async function taskChangeStatus(id,status){try{await apiRequest('appSetTaskStatus',[state.initData,id,status],{ttl:0,force:true});toast('Статус обновлён');await renderTasksSilently();openTask(id);}catch(e){toast(e.message)}}
async function taskSendComment(id){const value=$('#task_comment')?.value.trim();if(!value)return toast('Напишите комментарий');try{await apiRequest('appCommentTask',[state.initData,id,value],{ttl:0,force:true});toast('Комментарий добавлен');openTask(id)}catch(e){toast(e.message)}}
