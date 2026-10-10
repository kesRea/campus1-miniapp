/* CAMPUS_UI_MANAGEMENT_V13_11 */
/* CAMPUS_GITHUB_UI_V13_9_TASKS_SPECIAL */
/* V13.9.1 developer access visibility fix */
const CAMPUS_API_URL = 'https://campus1-db-47a56e67.pages.dev/api';
const APP_VERSION = '14.0.0';
const tg = window.Telegram?.WebApp || null;
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const state = {
  initData:'', user:null, dashboard:null, analytics:null, rooms:[],
  currentPage:'home', renderSeq:0, roomData:null, roomDataTime:0,
  studentLists:{}, studentListTime:{}, studentMap:new Map(),
  cache:new Map(), inflight:new Map(), special:null,
  searchTimer:null, theme:'light', lastCoreSync:0,
  roomFilterMode:'all', seasonMode:'auto', seasonResolved:'autumn', remoteManifest:null, updateCheckTime:0
};

const UPDATE_CENTER_VERSION = '14.0.0';
const CLOUD_APP_URL = 'https://kesrea.github.io/campus1-miniapp/';
const UPDATE_MANIFEST_URL = CLOUD_APP_URL + 'version.json';
const CAMPUS_UPDATES = [
{version:'14.0.0',date:'9 октября 2026',title:'Telegram Avatars + Foreigners',latest:true,items:[
 'Возвращены Telegram-аватарки в профиль, Студсовет, Активисты и управление ролями.',
 'Фото Telegram сохраняется при входе пользователя в Mini App и затем показывается в списках.',
 'Раздел «Иностранцы» автоматически дополняется студентами с зарубежной резиденцией из поля «Прописка».',
 'Поддерживаются Монголия, Туркменистан, Узбекистан, Кыргызстан, Россия, Китай и другие страны.',
 'Ручная таблица иностранцев сохранена и объединяется с автоматическим списком без дублей.'
]},

{version:'13.13.0',date:'9 октября 2026',title:'Speed+',latest:false,items:[
 'Ускорен запуск: убран лишний последовательный запрос к Apps Script.',
 'Студенты и комнаты приходят уже в первом bootstrap-ответе.',
 'Вкладки прогреваются при касании нижней навигации.',
 'Повторные поиски, комнаты и справочные разделы используют быстрый кэш.',
 'Backend получил короткий безопасный кэш сессии и данных студентов.'
]},

{version:'13.12.6',date:'9 октября 2026',title:'Splash Light + Council Order',latest:false,items:[
 'Экран подключения и проверки доступа всегда отображается в светлой теме.',
 'Основная тема приложения после входа не изменяется.',
 'В Студсовете порядок: председатель, заместитель, Глава СДК, заместитель Главы СДК, затем остальные.'
]},

{version:'13.11',date:'9 октября 2026',title:'Unified Recovery',latest:false,items:[
 'Исправлен сервер задач: создание, делегирование, сроки, статусы, комментарии и поток событий.',
 'Панель владельца и разработчика теперь подтверждается сервером; developer ID 7272434463.',
 'Технические работы реально блокируют всех остальных на сервере и снимаются автоматически после выключения.',
 'Исправлены должности и сектора без потери прав доступа. Владелец по умолчанию — Глава СДК.',
 'ИИ удалён из API; вкладка задач остаётся основной.'
]},
{version:'13.10',date:'9 октября 2026',title:'Технические работы и роли',latest:false,items:[
 'Владелец и разработчик вручную включают технические работы для всех остальных.',
 'Приложение автоматически открывается после завершения работ.',
 'Председатель, заместители, главы, участники и активисты; секторы СДК, SMM, ОПМ и САН.',
 'Должности учитываются отдельно от прав доступа. Назначение доступно администрации, владельцу и разработчику.'
]},
{
  version:'13.9',
  date:'9 октября 2026',
  title:'Задачи и панель управления',
  latest:false,
  items:[
    'Раздел задач вместо прежней вкладки: задачи, проекты, потоки, шаблоны и календарь.',
    'Руководитель делегирует исполнителю с сохранением ответственности и сроков.',
    'Статусы, протокол изменений, комментарии и оповещения в Telegram.',
    'Появилась отдельная защищённая панель для владельца и разработчика.'
  ]
},


{
  version:'13.8',
  date:'9 октября 2026',
  title:'Documents+',
  latest:false,
  items:[
    'Добавлен полноценный раздел документов.',
    'Добавлены шаблоны объявлений, докладных, актов проверки и служебных записок.',
    'Документ собирается из формы и сразу показывается в предпросмотре.',
    'Можно копировать текст, делиться через системное меню и сохранять черновики на устройстве.',
    'Добавлена история последних документов и быстрый повторный запуск шаблона.'
  ]
},

{
  version:'13.7',
  date:'9 октября 2026',
  title:'Seasons Reborn',
  latest:false,
  items:[
    'Вернулась приватная кнопка смены сезонов только для владельца.',
    'Осень сохранена с понравившимися жёлто-коричневыми листьями.',
    'Зима получила новую аккуратную гирлянду без отдельного тёмного баннера.',
    'Весна и лето полностью переоформлены в лёгком стиле.',
    'Сезоны автоматически меняются по времени года, а владелец может переключать их вручную.'
  ]
},

{
  version:'13.6',
  date:'9 октября 2026',
  title:'UI Clean Autumn',
  latest:false,
  items:[
    'Исправлена кнопка обновлений и проверка версии.',
    'Исправлена прокрутка экранов и более стабильная навигация.',
    'Убраны гирлянда, лишние точки и тяжёлый декоративный мусор.',
    'Светлая и тёмная темы стали чище и аккуратнее.',
    'Добавлены минимальные осенние листья в жёлто-коричневой гамме.'
  ]
},
  {
    version:'13.4',
    date:'9 октября 2026',
    title:'Cloud Update System',
    latest:false,
    items:[
      'Campus №1 теперь проверяет новую версию напрямую через GitHub.',
      'Кнопка Telegram переводится на постоянный адрес — менять её для каждой версии больше не нужно.',
      'Backend можно хранить в GitHub без токенов и автоматически разворачивать через GitHub Actions.',
      'Проект становится переносимым: его можно продолжить с другого компьютера после обычного git clone.'
    ]
  },
  {
    version:'13.3',
    date:'9 октября 2026',
    title:'Rooms+',
    latest:false,
    items:[
      'Раздел комнат получил компактную сводку по заселению.',
      'Добавлены фильтры: все, свободные, занятые и комнаты с 3+ проживающими.',
      'Недавно открытые комнаты теперь доступны в один тап.',
      'Карточки комнат стали информативнее и быстрее фильтруются без запросов к серверу.'
    ]
  },
  
  {
    version:'13.1',
    date:'9 октября 2026',
    title:'Центр обновлений',
    latest:false,
    items:[
      'Добавлена аккуратная кнопка «Что нового» справа сверху.',
      'Новая версия отмечается маленькой синей точкой.',
      'Добавлена история последних обновлений Campus №1.'
    ]
  },
  {
    version:'13.0',
    date:'9 октября 2026',
    title:'Скорость и полировка',
    items:[
      'Студенты и комнаты открываются быстрее благодаря кэшу.',
      'Поиск сначала работает локально, без лишнего ожидания сервера.',
      'Улучшено хранение настроек и стабильность навигации.',
      'Доработаны анимации, нажатия и тёмная тема.'
    ]
  },
  
  {
    version:'10.3',
    date:'9 октября 2026',
    title:'Быстрый запуск',
    items:[
      'Добавлена постоянная кнопка Campus №1 рядом с полем сообщения Telegram.',
      'Для запуска приложения больше не требуется каждый раз писать /start.'
    ]
  }
];

const ICONS = {
  home:'<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/></svg>',
  users:'<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  grid:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
  spark:'<svg viewBox="0 0 24 24"><path d="m12 3 1.3 4.2L17.5 8.5l-4.2 1.3L12 14l-1.3-4.2-4.2-1.3 4.2-1.3L12 3Z"/><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/></svg>',
  menu:'<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  bed:'<svg viewBox="0 0 24 24"><path d="M3 7v14M21 12v9M3 16h18"/><path d="M7 16v-5h5a4 4 0 0 1 4 4v1"/><path d="M7 11V8h4a2 2 0 0 1 2 2v1"/></svg>',
  door:'<svg viewBox="0 0 24 24"><path d="M5 21h14"/><path d="M7 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17"/><circle cx="14" cy="12" r=".7" fill="currentColor" stroke="none"/></svg>',
  globe:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>',
  shield:'<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>',
  chart:'<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  swap:'<svg viewBox="0 0 24 24"><path d="M7 7h11l-3-3M17 17H6l3 3"/></svg>',
  chevron:'<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>',
  back:'<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>',
  moon:'<svg viewBox="0 0 24 24"><path d="M20.5 14.5A8 8 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z"/></svg>',
  sun:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
  logout:'<svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/></svg>',
  book:'<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>',
  clipboard:'<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 9h6M9 13h6M9 17h4"/></svg>',
  council:'<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="7" r="2"/><path d="M2 21v-2a6 6 0 0 1 12 0v2M14 15a5 5 0 0 1 8 4v2"/></svg>',
  copy:'<svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>',
  trash:'<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5"/></svg>'
};

function icon(name){ return ICONS[name] || ICONS.grid; }
function injectIcons(){ $$('[data-icon]').forEach(el=>{ el.innerHTML=icon(el.dataset.icon); }); }
function initials(name){ return String(name||'C1').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase(); }

/* CAMPUS_V14_AVATARS_FOREIGNERS */
function avatarHtml(
  name,
  photoUrl,
  extraClass=''
){
  const fallback =
    esc(initials(name));

  const url =
    String(photoUrl||'').trim();

  return `<span class="avatar ${esc(extraClass)}">
    <span class="avatar-fallback">${fallback}</span>
    ${url
      ? `<img class="avatar-photo" src="${esc(url)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`
      : ''}
  </span>`;
}

function syncProfileAvatar(){
  const btn=$('#profileBtn');

  if(!btn)return;

  const u=state.user||{};
  const name=
    u.firstName||
    u.username||
    'C1';

  const fallback=
    esc(initials(name));

  const url=
    String(u.photoUrl||'').trim();

  btn.innerHTML=
    `<span class="profile-fallback">${fallback}</span>`+
    (url
      ? `<img class="profile-photo" src="${esc(url)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">`
      : '');
}
function roleLabel(u){ return u?.role || 'Пользователь'; }
function canManage(){ return !!state.user?.canManage; }
function formatCount(n,one,few,many){ n=Math.abs(Number(n)||0); const n10=n%10,n100=n%100; const word=(n10===1&&n100!==11)?one:(n10>=2&&n10<=4&&(n100<12||n100>14))?few:many; return `${n} ${word}`; }

function haptic(type='light'){ try{ tg?.HapticFeedback?.impactOccurred(type); }catch(e){} }

function normalizeSearch(v){
  return String(v??'').toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
}
function knownStudents(){
  const byRow=new Map();
  Object.values(state.studentLists).forEach(list=>(list||[]).forEach(s=>byRow.set(Number(s.rowNumber),s)));
  return [...byRow.values()];
}
function localStudentSearch(q){
  const needle=normalizeSearch(q);
  if(!needle)return [];
  const digits=needle.replace(/\D/g,'');
  return knownStudents().filter(s=>{
    const hay=normalizeSearch([s.fio,s.room,s.faculty,s.iin,s.registration].filter(Boolean).join(' '));
    if(hay.includes(needle))return true;
    if(digits.length>=3){
      const idDigits=String(s.iin||'').replace(/\D/g,'');
      if(idDigits.includes(digits))return true;
    }
    return false;
  });
}
function coreIsFresh(ts,maxAge=60000){ return !!ts && Date.now()-ts<maxAge; }

function toast(message){
  const el=$('#toast'); if(!el) return;
  el.textContent=message; el.classList.remove('hidden');
  clearTimeout(toast._t); toast._t=setTimeout(()=>el.classList.add('hidden'),2600);
}

function applyTheme(theme, persist=true){
  state.theme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = state.theme;
  if(persist) localStorage.setItem('campus-theme',state.theme);
  const btn=$('#themeBtn'); if(btn) btn.innerHTML=icon(state.theme==='dark'?'sun':'moon');
  const meta=$('meta[name="theme-color"]'); if(meta) meta.content=state.theme==='dark'?'#0B111B':'#F5F8FD';
  try{
    tg?.setHeaderColor(state.theme==='dark'?'#0b111b':'#f5f8fd');
    tg?.setBackgroundColor(state.theme==='dark'?'#0b111b':'#f5f8fd');
  }catch(e){}
  const sw=$('#themeSwitch'); if(sw) sw.classList.toggle('on',state.theme==='dark');
}

function initTheme(){
  const saved=localStorage.getItem('campus-theme');
  const telegramDark=tg?.colorScheme==='dark';
  const systemDark=matchMedia?.('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || ((telegramDark||systemDark)?'dark':'light'), false);
}
function toggleTheme(){ applyTheme(state.theme==='dark'?'light':'dark'); }


const CAMPUS_SEASONS = {
  auto:{label:'Авто',glyph:'✨'},
  off:{label:'Выкл',glyph:'○'},
  autumn:{label:'Осень',glyph:'🍂'},
  winter:{label:'Зима',glyph:'❄️'},
  spring:{label:'Весна',glyph:'🌸'},
  summer:{label:'Лето',glyph:'☀️'}
};

function resolveAutoSeason(){
  const m=new Date().getMonth()+1;
  if(m===12 || m<=2)return 'winter';
  if(m>=3 && m<=5)return 'spring';
  if(m>=6 && m<=8)return 'summer';
  return 'autumn';
}

function resolveSeasonMode(mode){
  if(mode==='off')return 'none';
  if(mode==='auto')return resolveAutoSeason();
  return ['autumn','winter','spring','summer'].includes(mode)?mode:resolveAutoSeason();
}

function seasonLabel(){
  const resolved=state.seasonResolved||resolveAutoSeason();
  const base=CAMPUS_SEASONS[resolved]?.label||'Сезон';
  return state.seasonMode==='auto' ? `${base} · Авто` : base;
}

function initSeasonTheme(){
  let mode='auto';
  if(state.user?.isOwner){
    try{mode=localStorage.getItem('campus-owner-season')||'auto'}catch(e){}
  }
  setSeasonMode(mode,false,false);
}

function setSeasonMode(mode,persist=true,rerender=true){
  const allowed=['auto','off','autumn','winter','spring','summer'];
  if(!allowed.includes(mode))mode='auto';

  if(!state.user?.isOwner && mode!=='auto')mode='auto';

  state.seasonMode=mode;
  state.seasonResolved=resolveSeasonMode(mode);

  document.documentElement.dataset.season=state.seasonResolved;

  if(persist && state.user?.isOwner){
    try{localStorage.setItem('campus-owner-season',mode)}catch(e){}
  }

  renderSeasonLayer();
  updateOwnerSeasonButton();

  const badge=$('#ownerSeasonBadge');
  if(badge)badge.textContent=seasonLabel();

  $$('.season-choice-v137').forEach(btn=>{
    btn.classList.toggle('active',btn.dataset.mode===state.seasonMode);
  });

  if(rerender && state.currentPage==='home')renderHome();
}

function updateOwnerSeasonButton(){
  const btn=$('#seasonBtn');
  const glyph=$('#seasonBtnGlyph');
  if(!btn)return;

  if(state.user?.isOwner){
    btn.classList.remove('hidden');
    const key=state.seasonResolved==='none'?'off':state.seasonResolved;
    if(glyph)glyph.textContent=CAMPUS_SEASONS[key]?.glyph||'🍂';
  }else{
    btn.classList.add('hidden');
  }
}

function ensureSeasonLayer(){
  let layer=$('#seasonLayer');
  if(layer)return layer;

  layer=document.createElement('div');
  layer.id='seasonLayer';
  layer.className='season-layer-v137';
  layer.setAttribute('aria-hidden','true');
  document.body.prepend(layer);
  return layer;
}

function seasonParticleStyle(i,kind){
  const x=((i*31+13)%94)+3;
  const delay=-(i*1.37)%12;
  const duration=(kind==='snow'?9:11)+(i%5)*1.15;
  const size=(kind==='snow'?5:10)+(i%4)*2;
  const drift=(i%2?1:-1)*(14+(i%5)*6);
  return `--sx:${x};--sd:${delay}s;--sdu:${duration}s;--ss:${size}px;--sdrift:${drift}px`;
}

function autumnLeafSvg(i){
  if(i%3===0){
    return `<svg viewBox="0 0 36 36"><path class="season-leaf-fill" d="M31 5C19 5.5 9.2 10.4 6.1 19.2c-2.4 6.7 2.2 11.2 8.6 9.5C23.8 26.3 29.2 16.8 31 5Z"/><path class="season-leaf-vein" d="M8.7 26.5C15 20.5 20.3 15.4 28.8 8.1M14.2 21.2l-1.1-6.1M18.4 17.4l6.1.2"/></svg>`;
  }
  if(i%3===1){
    return `<svg viewBox="0 0 36 36"><path class="season-leaf-fill" d="M18 3.5c1.6 4.1 3.5 6.2 7 8.7l-2.8 1.5c2.4 2.1 4.6 3.2 8.1 3.8l-3.7 2.4c1.2 2.4 2 4.7 2.1 8.2-4.4-.7-7.1-1.8-9.5-4.4l-1.2 8.7-1.2-8.7c-2.4 2.6-5.1 3.7-9.5 4.4.1-3.5.9-5.8 2.1-8.2l-3.7-2.4c3.5-.6 5.7-1.7 8.1-3.8L11 12.2c3.5-2.5 5.4-4.6 7-8.7Z"/><path class="season-leaf-vein" d="M18 7.6v21.9M18 18.3l-5.1-3.4M18 21.3l5.4-3.4"/></svg>`;
  }
  return `<svg viewBox="0 0 36 36"><path class="season-leaf-fill" d="M29.8 7.1C22 7 15 10.1 10.8 15.2c-4.5 5.4-3.2 11.4 2.2 13.8 5.8 2.5 12.9-.9 15.1-8.3 1.2-4.1 1.5-8.8 1.7-13.6Z"/><path class="season-leaf-vein" d="M10.7 27.6C16 22 21.1 16.9 28.1 9.3M16.3 21.9l-1-6M20.7 17.6l5.7.7"/></svg>`;
}

function renderSeasonLayer(){
  const layer=ensureSeasonLayer();
  const season=state.seasonResolved||'none';
  layer.className=`season-layer-v137 season-${season}`;
  layer.innerHTML='';

  if(season==='none')return;

  let reduce=false;
  try{reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches}catch(e){}
  if(reduce)return;

  if(season==='autumn'){
    for(let i=0;i<7;i++){
      const p=document.createElement('span');
      p.className=`season-fx season-leaf-v137 leaf-tone-${i%3}`;
      p.style.cssText=seasonParticleStyle(i,'leaf');
      p.innerHTML=autumnLeafSvg(i);
      layer.appendChild(p);
    }
    return;
  }

  if(season==='winter'){
    for(let i=0;i<18;i++){
      const p=document.createElement('span');
      p.className=`season-fx season-snow-v137 snow-type-${i%3}`;
      p.style.cssText=seasonParticleStyle(i,'snow');
      p.textContent=i%3===0?'✦':'•';
      layer.appendChild(p);
    }
    return;
  }

  if(season==='spring'){
    for(let i=0;i<9;i++){
      const p=document.createElement('span');
      p.className=`season-fx season-petal-v137 petal-tone-${i%3}`;
      p.style.cssText=seasonParticleStyle(i,'petal');
      layer.appendChild(p);
    }
    return;
  }

  if(season==='summer'){
    const glow=document.createElement('span');
    glow.className='summer-glow-v137';
    layer.appendChild(glow);
    for(let i=0;i<7;i++){
      const p=document.createElement('span');
      p.className='season-fx season-mote-v137';
      p.style.cssText=seasonParticleStyle(i,'mote');
      layer.appendChild(p);
    }
  }
}

function winterGarlandBulbs(){
  const bulbs=[
    ['5%','16px','#ff625f'],['13%','29px','#ffd34e'],['21%','19px','#55c7ff'],
    ['29%','31px','#5ed99c'],['37%','18px','#e986ff'],['45%','33px','#ff9f55'],
    ['54%','18px','#ffd34e'],['63%','31px','#55c7ff'],['72%','19px','#5ed99c'],
    ['81%','30px','#ff625f'],['89%','18px','#e986ff'],['96%','27px','#ff9f55']
  ];
  return bulbs.map(([x,y,c],i)=>`<span class="winter-bulb-v137" style="--bx:${x};--by:${y};--bc:${c};--bd:${i*.11}s"></span>`).join('');
}

function winterGarlandHtml(){
  if(state.seasonResolved!=='winter')return '';
  return `<div class="winter-garland-v137" aria-hidden="true">
    <svg class="winter-wire-v137" viewBox="0 0 1000 90" preserveAspectRatio="none">
      <path d="M-30 5 C220 72 390 58 520 40 C690 16 810 73 1030 9"/>
    </svg>
    <div class="winter-bulbs-v137">${winterGarlandBulbs()}</div>
  </div>`;
}

function openOwnerSeasonSettings(){
  if(!state.user?.isOwner)return toast('Эта кнопка доступна только владельцу');

  showModal(`
    <div class="sheet-handle"></div>
    <div class="season-owner-head">
      <span class="season-owner-badge">Только владелец</span>
      <h3>Смена сезона</h3>
      <p>Переключение сохраняется только на твоём устройстве. У остальных пользователей работает автоматический сезон.</p>
    </div>

    <div class="season-owner-current">
      <span>Сейчас</span>
      <b id="ownerSeasonBadge">${esc(seasonLabel())}</b>
    </div>

    <div class="season-choice-grid-v137">
      ${ownerSeasonChoice('auto','✨','Авто','По времени года')}
      ${ownerSeasonChoice('autumn','🍂','Осень','Жёлтые и коричневые листья')}
      ${ownerSeasonChoice('winter','❄️','Зима','Снег и новая гирлянда')}
      ${ownerSeasonChoice('spring','🌸','Весна','Лёгкие лепестки')}
      ${ownerSeasonChoice('summer','☀️','Лето','Солнечное свечение')}
      ${ownerSeasonChoice('off','○','Выкл','Без сезонных эффектов')}
    </div>

    <button class="btn btn-secondary btn-wide" type="button" onclick="closeModal()">Готово</button>
  `);
}

function ownerSeasonChoice(mode,glyph,title,sub){
  return `<button class="season-choice-v137 ${state.seasonMode===mode?'active':''}" data-mode="${mode}" type="button" onclick="setSeasonMode('${mode}')">
    <span class="season-choice-glyph">${glyph}</span>
    <span class="season-choice-copy"><b>${esc(title)}</b><small>${esc(sub)}</small></span>
    <span class="season-choice-check-v137">✓</span>
  </button>`;
}


async function apiRequest(method,args=[],options={}){
  if(maintenanceBlocked && method!=='appGetMaintenanceStatus')throw new Error('Происходят технические работы.');
  const readOnly = !/^app(Add|Update|Move|Evict|Create|Delegate|Set|Comment)/.test(method);
  const ttl = options.ttl ?? (readOnly ? 15000 : 0);
  const key = method+'|'+JSON.stringify(args);
  const now=Date.now();
  const cached=state.cache.get(key);
  if(!options.force && ttl && cached && now-cached.time<ttl) return cached.value;
  if(!options.force && state.inflight.has(key)) return state.inflight.get(key);

  const promise=(async()=>{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),22000);
    try{
      /* CAMPUS_V14_JSON_RETRY_HOTFIX
         Retry exactly once ONLY for read-only requests when the proxy /
         Apps Script temporarily returns HTML or another non-JSON body.
         Write requests are never retried automatically to avoid duplicates. */
      const fetchCampusAttempt=async()=>{
        const response=await fetch(CAMPUS_API_URL,{
          method:'POST',
          redirect:'follow',
          signal:controller.signal,
          headers:{
            'Content-Type':'text/plain;charset=utf-8'
          },
          body:JSON.stringify({method,args})
        });

        const text=await response.text();

        let data=null;
        let jsonOk=true;

        try{
          data=JSON.parse(text);
        }catch(e){
          jsonOk=false;
        }

        return {
          response,
          data,
          jsonOk
        };
      };

      let attempt=
        await fetchCampusAttempt();

      if(
        !attempt.jsonOk &&
        readOnly
      ){
        await new Promise(
          resolve=>setTimeout(resolve,700)
        );

        attempt=
          await fetchCampusAttempt();
      }

      if(!attempt.jsonOk){
        throw new Error(
          'Campus API временно вернул некорректный ответ. Повторите попытку.'
        );
      }

      const response=attempt.response;
      const data=attempt.data;
      if(data.code==='CAMPUS_MAINTENANCE') {maintenanceOverlay({message:data.error});beginMaintenancePolling();}
      if(!response.ok || !data.ok){
        let message=data?.error || 'Ошибка Campus API.';
        if(String(message).startsWith('CAMPUS_MAINTENANCE|')){
          message=String(message).slice('CAMPUS_MAINTENANCE|'.length);
          try{
            maintenanceOverlay({message});
            beginMaintenancePolling();
          }catch(_e){
            try{setTimeout(()=>pollMaintenance(),0)}catch(__e){}
          }
        }
        throw new Error(message);
      }
      if(ttl){
        state.cache.set(key,{time:Date.now(),value:data.result});
      }else if(!readOnly){
        state.cache.clear();
      }
      return data.result;
    }catch(e){
      if(e?.name==='AbortError') throw new Error('Сервер отвечает слишком долго. Повторите попытку.');
      throw e;
    }finally{
      clearTimeout(timer); state.inflight.delete(key);
    }
  })();
  state.inflight.set(key,promise);
  return promise;
}

function invalidateData(){
  state.cache.clear(); state.studentLists={}; state.studentMap.clear(); state.roomData=null;
}

async function boot(){
  const btn=$('#openStateBtn');
  try{
    tg?.ready(); tg?.expand();
    state.initData=tg?.initData || '';
    btn.onclick=boot;
    if(!state.initData){
      btn.disabled=false; btn.textContent='Повторить подключение';
      $('#splashText').textContent='Откройте Campus №1 кнопкой внутри Telegram-бота.';
      return;
    }
    btn.disabled=true; btn.textContent='Проверяем доступ…';
    beginMaintenancePolling();
    maintenanceBlocked=false;
    // CAMPUS_V13_13_SPEED_PLUS
    // appBootstrap already checks maintenance on the backend.
    const data=await apiRequest('appBootstrap',[state.initData],{ttl:0,force:true});
    state.user=data.user; state.dashboard=data.dashboard; state.analytics=data.analytics; state.rooms=data.rooms||[];

    if(Array.isArray(data.activeStudents)){
      state.studentLists.active=data.activeStudents;
      state.studentListTime.active=Date.now();
      indexStudents(data.activeStudents);
    }

    if(Array.isArray(data.roomData)){
      state.roomData=data.roomData;
      state.roomDataTime=Date.now();
    }

    state.lastCoreSync=Date.now();
    syncProfileAvatar();
    $('#splash').classList.add('hidden'); $('#app').classList.remove('hidden'); $('#bottomNav').classList.remove('hidden');
    injectIcons(); applyTheme(state.theme,false); initSeasonTheme(); updateOwnerSeasonButton(); updateUpdatesBadge(); render('home');
    clearMaintenanceOverlay();
    startAutomaticUpdateWatch();
    clearFinishedAutoUpdateAttempt();
    syncSpecialButton(); // show shield immediately after Telegram-authenticated appBootstrap
    const idle=window.requestIdleCallback || (fn=>setTimeout(fn,180));
    idle(()=>{prefetchCore();checkRemoteUpdate(true);loadSpecialAccess();});
    return true;
  }catch(e){
    btn.disabled=false; btn.textContent='Повторить вход'; btn.onclick=boot;
    $('#splashText').textContent=e?.message || String(e);
    return false;
  }
}

async function prefetchCore(){
  const jobs=[];

  if(!state.studentLists.active){
    jobs.push(
      apiRequest(
        'appGetStudents',
        [state.initData,'active'],
        {ttl:60000}
      ).then(students=>{
        state.studentLists.active=students;
        state.studentListTime.active=Date.now();
        indexStudents(students);
      })
    );
  }

  if(!state.roomData){
    jobs.push(
      apiRequest(
        'appGetRooms',
        [state.initData],
        {ttl:60000}
      ).then(rooms=>{
        state.roomData=rooms;
        state.roomDataTime=Date.now();
      })
    );
  }

  if(jobs.length){
    try{await Promise.all(jobs)}catch(e){}
  }

  setTimeout(async()=>{
    try{
      if(state.studentLists.all)return;
      const all=await apiRequest(
        'appGetStudents',
        [state.initData,'all'],
        {ttl:90000}
      );
      state.studentLists.all=all;
      state.studentListTime.all=Date.now();
      indexStudents(all);
    }catch(e){}
  },650);
}

function warmPage(page){
  try{
    if(page==='students' && !state.studentLists.active){
      apiRequest(
        'appGetStudents',
        [state.initData,'active'],
        {ttl:60000}
      ).then(list=>{
        state.studentLists.active=list;
        state.studentListTime.active=Date.now();
        indexStudents(list);
      }).catch(()=>{});
      return;
    }

    if(page==='rooms' && !state.roomData){
      apiRequest(
        'appGetRooms',
        [state.initData],
        {ttl:60000}
      ).then(list=>{
        state.roomData=list;
        state.roomDataTime=Date.now();
      }).catch(()=>{});
      return;
    }

    if(
      page==='tasks' &&
      typeof taskUI!=='undefined' &&
      !taskUI.ready
    ){
      Promise.all([
        apiRequest(
          'appGetTasks',
          [state.initData],
          {ttl:15000}
        ),
        apiRequest(
          'appGetTaskUsers',
          [state.initData],
          {ttl:60000}
        )
      ]).then(result=>{
        taskUI.items=result[0]||[];
        taskUI.users=result[1]||[];
        taskUI.ready=true;
      }).catch(()=>{});
    }
  }catch(e){}
}

function indexStudents(list){ (list||[]).forEach(s=>state.studentMap.set(Number(s.rowNumber),s)); }
function pageAlive(page,seq){ return state.currentPage===page && state.renderSeq===seq; }
function setNav(page){ $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===page)); }
function pageHead(title,back){ return `<div class="page-head"><button class="back-button" type="button" onclick="render('${back||'home'}')">${icon('back')}</button><h1>${esc(title)}</h1></div>`; }

async function render(page,opts={}){
  if(maintenanceBlocked)return;
  state.currentPage=page; state.renderSeq++; const seq=state.renderSeq; setNav(page);
  const view=$('#view'); if(!view) return;
  view.classList.remove('fade-in');
  requestAnimationFrame(
    ()=>view.classList.add('fade-in')
  );
  try{
    if(page==='special-release-test') return renderReleaseTester();

    if(page==='home') return renderHome();
    if(page==='students') return renderStudents(opts.mode||'active',opts.query||'',seq);
    if(page==='rooms') return renderRooms(seq);
    if(page==='tasks') return renderTasks();
    if(page==='special') return renderSpecial();
    if(page==='special-users') return renderCouncilRoles('special');
    if(page==='special-maintenance') return renderMaintenanceSettings();
    if(page==='council-roles') return renderCouncilRoles('more');
    if(page==='special-diagnostics') return renderSpecialDiagnostics();
    if(page==='special-design') return renderSpecialDesign();
    if(page==='more') return renderMore();
    if(page==='analytics') return renderAnalytics();
    if(page==='foreigners') return renderGenericTable('Иностранные студенты','appGetForeigners','more',seq);
    if(page==='council') return renderCouncil('council',seq);
    if(page==='activists') return renderCouncil('activists',seq);
    if(page==='control') return renderGenericTable('Контроль общежития','appGetControl','more',seq);
    if(page==='journal') return renderGenericTable('Журнал действий','appGetJournal','more',seq);
    if(page==='documents') return renderDocuments();
  }catch(e){ if(pageAlive(page,seq)) view.innerHTML=`${pageHead('Ошибка','home')}<div class="empty">${esc(e.message)}</div>`; }
}

function renderHome(){
  const d=state.dashboard||{};
  const occupancy=d.totalRooms ? Math.round((d.occupiedRooms||0)/d.totalRooms*100) : 0;
  $('#view').innerHTML=`
    <section class="hero-panel fade-in">
      ${winterGarlandHtml()}
      <div class="hero-copy">
        <small>Добро пожаловать,</small>
        <h1>${esc(state.user?.firstName || 'Пользователь')}</h1>
        <p>Campus №1 · ${esc(roleLabel(state.user))}</p>
      </div>
      <div class="hero-side">
        <span class="role-chip">${esc(roleLabel(state.user))}</span>
      </div>
      <div class="hero-leaves" aria-hidden="true">
        <span>🍁</span><span>🍂</span><span>🍁</span>
      </div>
    </section>

    <form class="global-search fade-in" onsubmit="homeSearch(event)">
      <span class="mini-icon">${icon('search')}</span>
      <input id="homeSearchInput" autocomplete="off" placeholder="Поиск студента, комнаты, ИИН…">
      <button class="search-action" type="submit">Найти</button>
    </form>

    <div class="section-heading fade-in"><h2>Обзор</h2><button onclick="render('analytics')">Аналитика</button></div>
    <div class="stats-grid fade-in">
      ${statCard('users',d.currentStudents||0,'Заселено сейчас','green','students')}
      ${statCard('door',d.freeRooms||0,'Свободно комнат','','rooms')}
      ${statCard('globe',d.foreigners||0,'Иностранные','','foreigners')}
      ${statCard('council',(d.council||0)+(d.activists||0),'Студсовет и активисты','','council')}
    </div>

    <div class="section-heading fade-in"><h2>Быстрые действия</h2></div>
    <div class="action-grid fade-in">
      ${canManage()?actionCard('plus','Заселить','Добавить нового студента',"openAddStudent()") : ''}
      ${actionCard('search','Найти студента','ФИО, ИИН или комната',"render('students')")}
      ${canManage()?actionCard('swap','Переселить','Найти студента и сменить комнату',"openQuickMove()"):actionCard('grid','Комнаты','Занятость Campus №1',"render('rooms')")}
      ${actionCard('chart','Аналитика','Динамика заселения',"render('analytics')")}
    </div>

    <div class="section-heading fade-in"><h2>Загрузка комнат</h2></div>
    <div class="capacity-card fade-in" onclick="render('rooms')">
      <div class="capacity-row"><b>Занято ${d.occupiedRooms||0} из ${d.totalRooms||0} комнат</b><span>${occupancy}%</span></div>
      <div class="progress"><span style="width:${Math.min(100,occupancy)}%"></span></div>
      <div class="capacity-meta"><span>${d.currentStudents||0} проживающих</span><span>${d.freeRooms||0} свободно</span></div>
    </div>

    <button class="task-promo fade-in" type="button" onclick="render('tasks')">
      <span class="action-icon">${icon('clipboard')}</span>
      <span class="task-promo-copy"><b>Задачи и проекты</b><small>Поручения, делегирование и сроки</small></span>
      <span class="arrow">›</span>
    </button>`;
}

function statCard(iconName,value,label,tone,page){ return `<button class="stat-card ${tone||''}" type="button" onclick="render('${page}')"><div class="stat-top"><span class="mini-icon">${icon(iconName)}</span></div><span class="stat-value">${Number(value)||0}</span><span class="stat-label">${esc(label)}</span></button>`; }
function actionCard(iconName,title,subtitle,onclick){ return `<button class="action-card" type="button" onclick="${onclick}"><span class="action-icon">${icon(iconName)}</span><b>${esc(title)}</b><small>${esc(subtitle)}</small></button>`; }
function homeSearch(e){ e.preventDefault(); const q=$('#homeSearchInput')?.value.trim()||''; render('students',{mode:'all',query:q}); }

async function renderStudents(mode='active',query='',seq=state.renderSeq){
  $('#view').innerHTML=`${pageHead('Студенты','home')}
    <form class="global-search" onsubmit="studentSearchSubmit(event)"><span class="mini-icon">${icon('search')}</span><input id="studentSearch" autocomplete="off" value="${esc(query)}" placeholder="ФИО, ИИН, комната, факультет" oninput="studentSearchInput(this.value)"><button class="search-action" type="submit">Найти</button></form>
    <div id="studentSearchHint" class="search-hint"></div>
    <div class="tabs"><button class="tab ${mode==='active'?'active':''}" onclick="renderStudents('active','',state.renderSeq)" type="button">Заселены</button><button class="tab ${mode==='all'?'active':''}" onclick="renderStudents('all','',state.renderSeq)" type="button">Все</button><button class="tab ${mode==='evicted'?'active':''}" onclick="renderStudents('evicted','',state.renderSeq)" type="button">Выселены</button></div>
    <div id="studentList" class="list">${studentSkeletons()}</div>`;

  if(query){ return doStudentSearch(query,seq); }
  const cached=state.studentLists[mode];
  if(cached){
    drawStudents(cached);
    if(!coreIsFresh(state.studentListTime[mode],60000)) refreshStudents(mode,seq,true);
    return;
  }
  const list=await apiRequest('appGetStudents',[state.initData,mode],{ttl:60000});
  if(!pageAlive('students',seq)) return;
  state.studentLists[mode]=list; state.studentListTime[mode]=Date.now(); indexStudents(list); drawStudents(list);
}
function studentSkeletons(){ return Array.from({length:5},()=>'<div class="row-card"><div class="avatar skeleton"></div><div class="row-main"><div class="skeleton" style="height:14px;width:70%"></div><div class="skeleton" style="height:10px;width:50%;margin-top:7px"></div></div></div>').join(''); }
async function refreshStudents(mode,seq,silent){
  try{
    const list=await apiRequest('appGetStudents',[state.initData,mode],{ttl:0,force:true});
    state.studentLists[mode]=list; state.studentListTime[mode]=Date.now(); indexStudents(list);
    if(pageAlive('students',seq)) drawStudents(list);
  }catch(e){ if(!silent) toast(e.message); }
}
function drawStudents(list){
  const el=$('#studentList'); if(!el)return;
  if(!list?.length){el.innerHTML='<div class="empty">Ничего не найдено</div>';return;}
  el.innerHTML=list.map(s=>`<button class="row-card clickable" type="button" onclick="openStudent(${Number(s.rowNumber)})"><span class="avatar">${esc(initials(s.fio))}</span><span class="row-main"><b>${esc(s.fio)}</b><small>Комната ${esc(s.room||'—')} · ${esc(s.faculty||'Факультет не указан')}</small></span><span class="badge ${s.active?'':'red'}">${s.active?'Заселен':'Выселен'}</span></button>`).join('');
}
function studentSearchInput(value){
  clearTimeout(state.searchTimer);
  const q=String(value||'').trim();
  state.searchTimer=setTimeout(()=>{
    if(state.currentPage!=='students')return;
    const hint=$('#studentSearchHint');
    if(!q){
      if(hint)hint.textContent='';
      const list=state.studentLists.active||state.studentLists.all||[];
      drawStudents(list);
      return;
    }
    const local=localStudentSearch(q);
    if(local.length){
      drawStudents(local);
      if(hint)hint.textContent=`Мгновенный поиск · найдено ${local.length}`;
    }else{
      if(hint)hint.textContent='В локальном кэше совпадений нет · нажмите «Найти» для проверки базы';
    }
  },45);
}
function studentSearchSubmit(e){
  e.preventDefault();
  doStudentSearch($('#studentSearch')?.value.trim()||'',state.renderSeq);
}
async function doStudentSearch(q,seq=state.renderSeq){
  if(!q){ return renderStudents('active','',seq); }

  const local=localStudentSearch(q);
  const hint=$('#studentSearchHint');
  if(local.length){
    drawStudents(local);
    if(hint)hint.textContent=`Найдено ${local.length} · уточняем в базе…`;
  }else{
    const el=$('#studentList'); if(el) el.innerHTML=studentSkeletons();
    if(hint)hint.textContent='Проверяем базу…';
  }

  try{
    const list=await apiRequest('appSearchStudents',[state.initData,q],{ttl:20000});
    if(!pageAlive('students',seq))return;
    indexStudents(list); drawStudents(list);
    if(hint)hint.textContent=`База проверена · найдено ${(list||[]).length}`;
  }catch(e){
    if(pageAlive('students',seq)){
      if(local.length){
        drawStudents(local);
        if(hint)hint.textContent='Показаны данные из локального кэша';
      }else{
        $('#studentList').innerHTML=`<div class="empty">${esc(e.message)}</div>`;
      }
    }
  }
}

async function openStudent(row){
  try{
    let s=state.studentMap.get(Number(row));
    if(!s){ s=await apiRequest('appGetStudent',[state.initData,row],{ttl:15000}); state.studentMap.set(Number(row),s); }
    const actions=canManage()&&s.active?`<div class="button-row"><button class="btn btn-secondary" onclick="openMove(${s.rowNumber})">Переселить</button><button class="btn btn-danger" onclick="confirmEvict(${s.rowNumber})">Выселить</button></div>`:'';
    showModal(`<div class="sheet-handle"></div><h3>${esc(s.fio)}</h3><span class="badge ${s.active?'':'red'}">${s.active?'Проживает':'Выселен'}</span><div class="kv"><div><small>Комната</small><b>${esc(s.room||'—')}</b></div><div><small>Факультет</small><b>${esc(s.faculty||'—')}</b></div><div><small>ИИН / паспорт</small><b>${esc(s.iin||'—')}</b></div><div><small>Заселение</small><b>${esc(s.dateIn||'—')}</b></div><div><small>Дата рождения</small><b>${esc(s.birthDate||'—')}</b></div><div><small>Прописка</small><b>${esc(s.registration||'—')}</b></div></div>${actions}<button class="btn btn-secondary btn-wide" onclick="closeModal()">Закрыть</button>`);
  }catch(e){toast(e.message)}
}


function getRecentRooms(){
  try{
    const arr=JSON.parse(localStorage.getItem('campus-recent-rooms')||'[]');
    return Array.isArray(arr)?arr.slice(0,6):[];
  }catch(e){return []}
}
function rememberRoom(room){
  try{
    const value=String(room);
    const arr=[value,...getRecentRooms().filter(x=>String(x)!==value)].slice(0,6);
    localStorage.setItem('campus-recent-rooms',JSON.stringify(arr));
  }catch(e){}
}
function roomStats(list){
  const rows=list||[];
  const total=rows.length;
  const occupied=rows.filter(r=>Number(r.occupants||0)>0).length;
  const free=total-occupied;
  const crowded=rows.filter(r=>Number(r.occupants||0)>=3).length;
  return {total,occupied,free,crowded};
}
function renderRoomSummary(list){
  const el=$('#roomSummary'); if(!el)return;
  const s=roomStats(list);
  el.innerHTML=`
    <div class="room-summary-item"><b>${s.total}</b><span>Всего</span></div>
    <div class="room-summary-item free"><b>${s.free}</b><span>Свободно</span></div>
    <div class="room-summary-item busy"><b>${s.occupied}</b><span>Занято</span></div>
    <div class="room-summary-item crowded"><b>${s.crowded}</b><span>3+ чел.</span></div>`;
}
function renderRecentRooms(){
  const wrap=$('#recentRoomsWrap');
  const el=$('#recentRooms');
  if(!wrap||!el)return;
  const recent=getRecentRooms().filter(r=>(state.rooms||[]).map(String).includes(String(r)));
  wrap.classList.toggle('hidden',!recent.length);
  el.innerHTML=recent.map(r=>`<button type="button" class="recent-room-chip" onclick="openRoom('${esc(r)}')">№${esc(r)}</button>`).join('');
}
function setRoomFilter(mode){
  state.roomFilterMode=mode||'all';
  $$('.room-filter-chip').forEach(b=>b.classList.toggle('active',b.dataset.filter===state.roomFilterMode));
  filterRooms();
}
function filteredRooms(){
  const q=$('#roomFilter')?.value.trim()||'';
  const mode=state.roomFilterMode||'all';
  return (state.roomData||[]).filter(r=>{
    const n=Number(r.occupants||0);
    const textOk=!q||String(r.room).includes(q);
    if(!textOk)return false;
    if(mode==='free')return n===0;
    if(mode==='busy')return n>0;
    if(mode==='crowded')return n>=3;
    return true;
  });
}

async function renderRooms(seq=state.renderSeq){
  $('#view').innerHTML=`${pageHead('Комнаты','home')}
    <div id="roomSummary" class="room-summary">
      <div class="room-summary-item skeleton-card"></div>
      <div class="room-summary-item skeleton-card"></div>
      <div class="room-summary-item skeleton-card"></div>
      <div class="room-summary-item skeleton-card"></div>
    </div>

    <div class="room-toolbar">
      <div class="global-search room-search">
        <span class="mini-icon">${icon('search')}</span>
        <input id="roomFilter" autocomplete="off" inputmode="numeric" placeholder="Номер комнаты" oninput="filterRooms()">
        <span id="roomResultCount" class="room-result-count"></span>
      </div>

      <div class="room-filter-row">
        <button class="room-filter-chip ${state.roomFilterMode==='all'?'active':''}" data-filter="all" onclick="setRoomFilter('all')">Все</button>
        <button class="room-filter-chip ${state.roomFilterMode==='free'?'active':''}" data-filter="free" onclick="setRoomFilter('free')">Свободные</button>
        <button class="room-filter-chip ${state.roomFilterMode==='busy'?'active':''}" data-filter="busy" onclick="setRoomFilter('busy')">Занятые</button>
        <button class="room-filter-chip ${state.roomFilterMode==='crowded'?'active':''}" data-filter="crowded" onclick="setRoomFilter('crowded')">3+ чел.</button>
      </div>
    </div>

    <div id="recentRoomsWrap" class="recent-rooms-wrap hidden">
      <div class="recent-rooms-title">Недавно открывали</div>
      <div id="recentRooms" class="recent-rooms"></div>
    </div>

    <div class="room-range-note">Комнаты Campus №1: 13, 14, 23, 30–117, 119–125, 128–162</div>
    <div id="roomsGrid" class="rooms-grid">${roomSkeletons()}</div>`;

  if(state.roomData){
    renderRoomSummary(state.roomData);
    renderRecentRooms();
    drawRooms(filteredRooms());
    if(!coreIsFresh(state.roomDataTime,60000)) refreshRooms(seq,true);
    return;
  }

  const list=await apiRequest('appGetRooms',[state.initData],{ttl:60000});
  if(!pageAlive('rooms',seq))return;
  state.roomData=list;
  state.roomDataTime=Date.now();
  renderRoomSummary(list);
  renderRecentRooms();
  drawRooms(filteredRooms());
}
function roomSkeletons(){
  return Array.from({length:12},()=>'<div class="room-card"><div class="skeleton" style="height:22px;width:42%;margin:8px auto"></div><div class="skeleton" style="height:10px;width:65%;margin:10px auto"></div></div>').join('')
}
async function refreshRooms(seq,silent){
  try{
    const list=await apiRequest('appGetRooms',[state.initData],{ttl:0,force:true});
    state.roomData=list;
    state.roomDataTime=Date.now();
    if(pageAlive('rooms',seq)){
      renderRoomSummary(list);
      renderRecentRooms();
      drawRooms(filteredRooms());
    }
  }catch(e){if(!silent)toast(e.message)}
}
function drawRooms(list){
  const el=$('#roomsGrid'); if(!el)return;
  const rows=list||[];
  const count=$('#roomResultCount');
  if(count)count.textContent=rows.length?String(rows.length):'0';

  if(!rows.length){
    el.innerHTML='<div class="empty rooms-empty">Комнаты по этому фильтру не найдены</div>';
    return;
  }

  el.innerHTML=rows.map(r=>{
    const n=Number(r.occupants||0);
    const cls=n===0?'empty':(n>=3?'crowded':'busy');
    const label=n===0?'Свободна':formatCount(n,'проживает','проживают','проживают');
    return `<button class="room-card ${cls}" type="button" onclick="openRoom('${esc(r.room)}')">
      <span class="room-dot"></span>
      ${n>0?`<span class="room-count-badge">${n}</span>`:''}
      <b>${esc(r.room)}</b>
      <small>${label}</small>
    </button>`;
  }).join('');
}
function filterRooms(){
  drawRooms(filteredRooms());
}
async function openRoom(room){
  try{
    rememberRoom(room);
    renderRecentRooms();

    let occupants=null;
    const active=state.studentLists.active;
    if(active) occupants=active.filter(s=>String(s.room)===String(room));
    if(!occupants){
      occupants=(await apiRequest('appGetRoom',[state.initData,room],{ttl:60000})).occupants||[];
      indexStudents(occupants);
    }

    const status=occupants.length
      ? `<span class="room-detail-status occupied">${formatCount(occupants.length,'проживающий','проживающих','проживающих')}</span>`
      : `<span class="room-detail-status free">Свободна</span>`;

    showModal(`<div class="sheet-handle"></div>
      <div class="room-detail-head">
        <div><small>Campus №1</small><h3>Комната №${esc(room)}</h3></div>
        ${status}
      </div>

      <div class="room-detail-list list">
        ${occupants.length
          ? occupants.map(s=>`<button class="row-card clickable" onclick="openStudent(${s.rowNumber})">
              <span class="avatar">${esc(initials(s.fio))}</span>
              <span class="row-main"><b>${esc(s.fio)}</b><small>${esc(s.faculty||'Факультет не указан')}</small></span>
              <span class="mini-chevron">${icon('chevron')}</span>
            </button>`).join('')
          : `<div class="room-free-state"><span>${icon('door')}</span><b>Комната свободна</b><small>Сейчас здесь никто не проживает</small></div>`}
      </div>

      ${canManage()?`<button class="btn btn-primary btn-wide" onclick="closeModal();openAddStudent('${esc(room)}')">Заселить в комнату №${esc(room)}</button>`:''}
      <button class="btn btn-secondary btn-wide" onclick="closeModal()">Закрыть</button>`);
  }catch(e){toast(e.message)}
}

function renderAnalytics(){
  const a=state.analytics||{},d=a.dashboard||state.dashboard||{},m=a.months||[]; const max=Math.max(1,...m.map(x=>x.inCount||0));
  $('#view').innerHTML=`${pageHead('Аналитика','home')}<div class="stats-grid">${statCard('users',d.currentStudents||0,'Заселено','','students')}${statCard('door',d.freeRooms||0,'Свободно','','rooms')}${statCard('grid',d.occupiedRooms||0,'Занято','','rooms')}${statCard('grid',d.totalRooms||0,'Всего комнат','','rooms')}</div><div class="section-heading"><h2>Заселения за 6 месяцев</h2></div><div class="panel"><div class="chart">${m.map(x=>`<div class="bar-wrap"><div class="bar" style="height:${Math.max(6,Math.round((x.inCount||0)/max*120))}px"></div><span>${esc(x.label)}</span></div>`).join('')}</div></div><div class="section-heading"><h2>Распределение комнат</h2></div><div class="panel"><div class="mini-stat-grid"><div class="mini-stat"><b>${a.distribution?.empty||0}</b><small>Пустые</small></div><div class="mini-stat"><b>${a.distribution?.one||0}</b><small>1 человек</small></div><div class="mini-stat"><b>${a.distribution?.two||0}</b><small>2 человека</small></div><div class="mini-stat"><b>${a.distribution?.three||0}</b><small>3 человека</small></div><div class="mini-stat"><b>${a.distribution?.fourPlus||0}</b><small>4+ человека</small></div></div></div>`;
}

function renderMore(){
  const seasonOwnerRow=state.user?.isOwner
    ? `<button class="setting-row setting-row-button owner-season-setting-row" type="button" onclick="openOwnerSeasonSettings()">
         <div class="setting-copy">
           <b>Смена сезона</b>
           <small>Только для владельца · ${esc(seasonLabel())}</small>
         </div>
         <span class="season-settings-glyph">${CAMPUS_SEASONS[state.seasonResolved==='none'?'off':state.seasonResolved]?.glyph||'🍂'}</span>
       </button>`
    : '';

  $('#view').innerHTML=`${pageHead('Ещё','home')}
    <div class="more-grid">
      ${moreCard('globe','Иностранцы','Отдельный список',"render('foreigners')")}
      ${moreCard('council','Студсовет','Состав и сектора',"render('council')")}
      ${state.user?.canAssignRoles?moreCard('users','Роли и секторы','Назначение должностей',"render('council-roles')"):''}
      ${moreCard('users','Активисты','Список активистов',"render('activists')")}
      ${moreCard('shield','Контроль','Замечания и нарушения',"render('control')")}
      ${moreCard('clipboard','Журнал','История действий',"render('journal')")}
      ${moreCard('chart','Аналитика','Заселение и комнаты',"render('analytics')")}
      ${moreCard('book','Документы','Шаблоны и быстрые документы',"render('documents')")}
    </div>
    <div class="section-heading"><h2>Настройки</h2></div>
    <div class="settings-card">
      <div class="setting-row">
        <div class="setting-copy"><b>Тёмная тема</b><small>Сохраняется на этом устройстве</small></div>
        <button id="themeSwitch" class="switch ${state.theme==='dark'?'on':''}" onclick="toggleTheme()"><span></span></button>
      </div>
      ${seasonOwnerRow}
      <button class="setting-row setting-row-button" type="button" onclick="showWhatsNew()">
        <div class="setting-copy"><b>Обновления системы</b><small>GitHub Cloud Update · проверка без компьютера</small></div>
        <span class="badge blue">v${APP_VERSION}</span>
      </button>
    </div>`;
}

const DOC_TEMPLATES_V138 = {
  announcement:{
    title:'Объявление',
    icon:'clipboard',
    subtitle:'Сообщение студентам',
    fields:[
      ['title','Заголовок','text','Важное объявление'],
      ['body','Текст объявления','textarea',''],
      ['date','Дата / срок','text',''],
      ['contact','Контакт / подпись','text','Администрация Campus №1']
    ]
  },
  report:{
    title:'Докладная о нарушении',
    icon:'shield',
    subtitle:'Фиксация нарушения',
    fields:[
      ['room','Комната','text',''],
      ['students','ФИО студентов','textarea',''],
      ['incident','Описание нарушения','textarea',''],
      ['date','Дата и время','text',''],
      ['author','Составил(а)','text','']
    ]
  },
  inspection:{
    title:'Акт проверки комнаты',
    icon:'door',
    subtitle:'Состояние комнаты',
    fields:[
      ['room','Комната','text',''],
      ['students','Проживающие','textarea',''],
      ['condition','Состояние комнаты','textarea',''],
      ['issues','Замечания / повреждения','textarea',''],
      ['date','Дата проверки','text',''],
      ['author','Проверил(а)','text','']
    ]
  },
  memo:{
    title:'Служебная записка',
    icon:'book',
    subtitle:'Официальное обращение',
    fields:[
      ['to','Кому','text','Коменданту Campus №1'],
      ['from','От кого','text',''],
      ['subject','Тема','text',''],
      ['body','Содержание','textarea',''],
      ['date','Дата','text','']
    ]
  },
  move:{
    title:'Список на переселение',
    icon:'swap',
    subtitle:'Комнаты и студенты',
    fields:[
      ['students','ФИО / текущая комната / новая комната','textarea',''],
      ['reason','Основание','textarea',''],
      ['date','Дата','text',''],
      ['author','Ответственный','text','']
    ]
  },
  free:{
    title:'Свободный документ',
    icon:'book',
    subtitle:'Без шаблона',
    fields:[
      ['title','Название','text','Документ'],
      ['body','Текст','textarea',''],
      ['author','Подпись','text',''],
      ['date','Дата','text','']
    ]
  }
};

function docHistoryKey(){return 'campus-documents-v138'}

function getDocumentHistory(){
  try{
    const arr=JSON.parse(localStorage.getItem(docHistoryKey())||'[]');
    return Array.isArray(arr)?arr.slice(0,12):[];
  }catch(e){return []}
}

function saveDocumentHistory(item){
  try{
    const arr=[item,...getDocumentHistory().filter(x=>x.id!==item.id)].slice(0,12);
    localStorage.setItem(docHistoryKey(),JSON.stringify(arr));
  }catch(e){}
}

function clearDocumentHistory(){
  try{localStorage.removeItem(docHistoryKey())}catch(e){}
  renderDocuments();
  toast('История документов очищена');
}

function documentTemplateCard(key,t){
  return `<button class="document-template-card" type="button" onclick="openDocumentBuilder('${key}')">
    <span class="document-template-icon">${icon(t.icon)}</span>
    <span class="document-template-copy"><b>${esc(t.title)}</b><small>${esc(t.subtitle)}</small></span>
    <span class="mini-chevron">${icon('chevron')}</span>
  </button>`;
}

function renderDocuments(){
  const history=getDocumentHistory();

  $('#view').innerHTML=`${pageHead('Документы','more')}
    <section class="documents-hero">
      <div class="documents-hero-icon">${icon('book')}</div>
      <div>
        <small>Campus №1</small>
        <h2>Быстрые документы</h2>
        <p>Заполните поля, а приложение подготовит текст по шаблону.</p>
      </div>
    </section>

    <div class="section-heading"><h2>Создать документ</h2></div>
    <div class="document-template-list">
      ${Object.entries(DOC_TEMPLATES_V138).map(([key,t])=>documentTemplateCard(key,t)).join('')}
    </div>

    <div class="section-heading">
      <h2>Недавние</h2>
      ${history.length?'<button type="button" onclick="confirmClearDocumentHistory()">Очистить</button>':''}
    </div>

    <div class="document-history-list">
      ${history.length
        ? history.map(doc=>`<button class="document-history-card" type="button" onclick="openSavedDocument('${esc(doc.id)}')">
            <span class="document-history-icon">${icon(DOC_TEMPLATES_V138[doc.template]?.icon||'book')}</span>
            <span class="document-history-copy">
              <b>${esc(doc.title||'Документ')}</b>
              <small>${esc(doc.savedAt||'')}</small>
            </span>
            <span class="mini-chevron">${icon('chevron')}</span>
          </button>`).join('')
        : '<div class="documents-empty">Здесь появятся последние созданные документы.</div>'}
    </div>`;
}

function confirmClearDocumentHistory(){
  showModal(`<div class="sheet-handle"></div>
    <h3>Очистить историю документов?</h3>
    <p class="document-modal-note">Сами документы из буфера или отправленных сообщений не удалятся. Очистится только локальная история на этом устройстве.</p>
    <button class="btn btn-danger btn-wide" onclick="closeModal();clearDocumentHistory()">Очистить историю</button>
    <button class="btn btn-secondary btn-wide" onclick="closeModal()">Отмена</button>`);
}

function todayDocumentDate(){
  try{
    return new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date());
  }catch(e){
    return new Date().toLocaleDateString();
  }
}

function openDocumentBuilder(templateKey,preset={}){
  const t=DOC_TEMPLATES_V138[templateKey]||DOC_TEMPLATES_V138.free;

  const fields=t.fields.map(([key,label,type,placeholder])=>{
    const value=preset[key]||((key==='date'&&!preset[key])?todayDocumentDate():'');
    if(type==='textarea'){
      return `<div class="field document-field">
        <label>${esc(label)}</label>
        <textarea id="doc_${esc(key)}" rows="4" placeholder="${esc(placeholder||'')}">${esc(value)}</textarea>
      </div>`;
    }
    return `<div class="field document-field">
      <label>${esc(label)}</label>
      <input id="doc_${esc(key)}" value="${esc(value)}" placeholder="${esc(placeholder||'')}" autocomplete="off">
    </div>`;
  }).join('');

  showModal(`<div class="sheet-handle"></div>
    <div class="document-builder-head">
      <span class="document-builder-icon">${icon(t.icon)}</span>
      <div><small>Новый документ</small><h3>${esc(t.title)}</h3></div>
    </div>

    <div class="document-builder-form">${fields}</div>

    <button class="btn btn-primary btn-wide" onclick="previewDocument('${templateKey}')">Предпросмотр</button>
    <button class="btn btn-secondary btn-wide" onclick="closeModal()">Отмена</button>`);
}

function collectDocumentFields(templateKey){
  const t=DOC_TEMPLATES_V138[templateKey]||DOC_TEMPLATES_V138.free;
  const data={};
  t.fields.forEach(([key])=>data[key]=$(`#doc_${key}`)?.value.trim()||'');
  return data;
}

function buildDocumentText(templateKey,d){
  const clean=v=>String(v||'').trim();
  const lines=[];

  if(templateKey==='announcement'){
    lines.push((clean(d.title)||'ОБЪЯВЛЕНИЕ').toUpperCase());
    lines.push('');
    if(clean(d.body))lines.push(clean(d.body));
    if(clean(d.date)){lines.push('');lines.push(`Дата / срок: ${clean(d.date)}`);}
    if(clean(d.contact)){lines.push('');lines.push(clean(d.contact));}
  }

  if(templateKey==='report'){
    lines.push('ДОКЛАДНАЯ О НАРУШЕНИИ');
    lines.push('');
    if(clean(d.date))lines.push(`Дата и время: ${clean(d.date)}`);
    if(clean(d.room))lines.push(`Комната: ${clean(d.room)}`);
    if(clean(d.students))lines.push(`Студенты: ${clean(d.students)}`);
    lines.push('');
    if(clean(d.incident))lines.push(clean(d.incident));
    if(clean(d.author)){lines.push('');lines.push(`Составил(а): ${clean(d.author)}`);}
  }

  if(templateKey==='inspection'){
    lines.push('АКТ ПРОВЕРКИ КОМНАТЫ');
    lines.push('');
    if(clean(d.date))lines.push(`Дата проверки: ${clean(d.date)}`);
    if(clean(d.room))lines.push(`Комната: ${clean(d.room)}`);
    if(clean(d.students))lines.push(`Проживающие: ${clean(d.students)}`);
    lines.push('');
    if(clean(d.condition))lines.push(`Состояние комнаты: ${clean(d.condition)}`);
    if(clean(d.issues))lines.push(`Замечания / повреждения: ${clean(d.issues)}`);
    if(clean(d.author)){lines.push('');lines.push(`Проверил(а): ${clean(d.author)}`);}
  }

  if(templateKey==='memo'){
    if(clean(d.to))lines.push(clean(d.to));
    if(clean(d.from))lines.push(`От: ${clean(d.from)}`);
    lines.push('');
    lines.push('СЛУЖЕБНАЯ ЗАПИСКА');
    if(clean(d.subject))lines.push(`Тема: ${clean(d.subject)}`);
    lines.push('');
    if(clean(d.body))lines.push(clean(d.body));
    if(clean(d.date)){lines.push('');lines.push(`Дата: ${clean(d.date)}`);}
  }

  if(templateKey==='move'){
    lines.push('СПИСОК НА ПЕРЕСЕЛЕНИЕ');
    lines.push('');
    if(clean(d.date))lines.push(`Дата: ${clean(d.date)}`);
    lines.push('');
    if(clean(d.students))lines.push(clean(d.students));
    if(clean(d.reason)){lines.push('');lines.push(`Основание: ${clean(d.reason)}`);}
    if(clean(d.author)){lines.push('');lines.push(`Ответственный: ${clean(d.author)}`);}
  }

  if(templateKey==='free'){
    lines.push((clean(d.title)||'ДОКУМЕНТ').toUpperCase());
    lines.push('');
    if(clean(d.body))lines.push(clean(d.body));
    if(clean(d.author)){lines.push('');lines.push(clean(d.author));}
    if(clean(d.date))lines.push(clean(d.date));
  }

  return lines.join('\n').replace(/\n{3,}/g,'\n\n').trim();
}

function previewDocument(templateKey){
  const t=DOC_TEMPLATES_V138[templateKey]||DOC_TEMPLATES_V138.free;
  const data=collectDocumentFields(templateKey);
  const text=buildDocumentText(templateKey,data);

  if(!text)return toast('Заполни хотя бы одно поле');

  const id='doc_'+Date.now();
  const savedAt=new Intl.DateTimeFormat('ru-RU',{
    day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'
  }).format(new Date());

  const item={
    id,
    template:templateKey,
    title:data.title||data.subject||t.title,
    text,
    data,
    savedAt
  };

  saveDocumentHistory(item);

  showDocumentPreview(item);
}

function showDocumentPreview(item){
  showModal(`<div class="sheet-handle"></div>
    <div class="document-preview-head">
      <div><small>Предпросмотр</small><h3>${esc(item.title||'Документ')}</h3></div>
      <span class="badge blue">Сохранено</span>
    </div>

    <pre id="documentPreviewText" class="document-preview-text">${esc(item.text||'')}</pre>

    <div class="document-preview-actions">
      <button class="btn btn-primary" type="button" onclick="copyDocumentText('${esc(item.id)}')">${icon('copy')}<span>Копировать</span></button>
      <button class="btn btn-secondary" type="button" onclick="shareDocumentText('${esc(item.id)}')">${icon('swap')}<span>Поделиться</span></button>
    </div>

    <button class="btn btn-secondary btn-wide" type="button" onclick="editSavedDocument('${esc(item.id)}')">Изменить</button>
    <button class="btn btn-secondary btn-wide" type="button" onclick="closeModal()">Закрыть</button>`);
}

function openSavedDocument(id){
  const item=getDocumentHistory().find(x=>x.id===id);
  if(!item)return toast('Документ не найден');
  showDocumentPreview(item);
}

function editSavedDocument(id){
  const item=getDocumentHistory().find(x=>x.id===id);
  if(!item)return toast('Документ не найден');
  openDocumentBuilder(item.template,item.data||{});
}

function getSavedDocument(id){
  return getDocumentHistory().find(x=>x.id===id);
}

function copyDocumentText(id){
  const item=getSavedDocument(id);
  if(!item)return toast('Документ не найден');

  const done=()=>{
    toast('Текст документа скопирован');
    try{tg?.HapticFeedback?.notificationOccurred('success')}catch(e){}
  };

  if(navigator.clipboard?.writeText){
    navigator.clipboard.writeText(item.text).then(done).catch(()=>fallbackCopyDocument(item.text,done));
  }else{
    fallbackCopyDocument(item.text,done);
  }
}

function fallbackCopyDocument(text,done){
  const ta=document.createElement('textarea');
  ta.value=text;
  ta.style.position='fixed';
  ta.style.opacity='0';
  document.body.appendChild(ta);
  ta.select();
  try{document.execCommand('copy');done()}catch(e){toast('Не удалось скопировать')}
  ta.remove();
}

async function shareDocumentText(id){
  const item=getSavedDocument(id);
  if(!item)return toast('Документ не найден');

  try{
    if(navigator.share){
      await navigator.share({title:item.title||'Campus №1',text:item.text});
      return;
    }
  }catch(e){
    if(e?.name==='AbortError')return;
  }

  copyDocumentText(id);
  toast('Системная отправка недоступна — текст скопирован');
}


function moreCard(iconName,title,sub,onclick){ return `<button class="more-item" type="button" onclick="${onclick}"><span class="action-icon">${icon(iconName)}</span><b>${esc(title)}</b><small>${esc(sub)}</small></button>`; }

async function renderGenericTable(title,fn,back,seq){
  $('#view').innerHTML=`${pageHead(title,back)}<div id="generic" class="list">${studentSkeletons()}</div>`;

  const data=await apiRequest(
    fn,
    [state.initData],
    {ttl:60000}
  );

  if(!pageAlive(state.currentPage,seq))return;

  const el=$('#generic');

  if(!data.rows?.length){
    el.innerHTML='<div class="empty">Таблица пока пустая или не подключена.</div>';
    return;
  }

  el.innerHTML=data.rows.map(r=>{
    const vals=Object.entries(r)
      .filter(([k,v])=>
        k!=='_rowNumber'&&
        k!=='Фото'&&
        k!=='photoUrl'&&
        !String(k).startsWith('_')&&
        String(v).trim()
      )
      .slice(0,5);

    const name=
      r['ФИО']||
      r['Имя']||
      vals[0]?.[1]||
      title;

    const photo=
      r['Фото']||
      r.photoUrl||
      '';

    return `<div class="row-card">
      ${avatarHtml(name,photo)}
      <span class="row-main">
        ${vals.map(([k,v],i)=>
          i===0
            ? `<b>${esc(v)}</b>`
            : `<small>${esc(k)}: ${esc(v)}</small>`
        ).join('')}
      </span>
    </div>`;
  }).join('');
}

async function renderCouncil(kind,seq){
  /* CAMPUS_V13_12_6_COUNCIL_ORDER */
  const title=kind==='activists'?'Активисты':'Студенческий совет';
  $('#view').innerHTML=`${pageHead(title,'more')}<div id="generic" class="list">${studentSkeletons()}</div>`;

  const data=await apiRequest('appGetCouncil',[state.initData,kind],{ttl:60000});

  if(!pageAlive(state.currentPage,seq))return;

  const el=$('#generic');

  if(!data.rows?.length){
    el.innerHTML='<div class="empty">Список пока пустой.</div>';
    return;
  }

  const getName=r=>
    r['ФИО'] ||
    r['Имя'] ||
    r['Аты-жөні'] ||
    Object.values(r).find(v=>v&&typeof v==='string') ||
    'Участник';

  const getRole=r=>
    r['Должность'] ||
    r['Роль'] ||
    r['Позиция'] ||
    r['Сектор'] ||
    '';

  const norm=v=>
    String(v||'')
      .toLowerCase()
      .replace(/ё/g,'е')
      .replace(/[._–—-]+/g,' ')
      .replace(/\s+/g,' ')
      .trim();

  const councilPriority=role=>{
    const r=norm(role);

    if(
      r.includes('заместитель главы сдк') ||
      r.includes('зам главы сдк') ||
      r.includes('заместитель главы сектора документации и контроля') ||
      r.includes('зам главы сектора документации и контроля')
    ) return 4;

    if(
      r==='глава сдк' ||
      r.includes('глава сектора документации и контроля') ||
      r.includes('руководитель сдк')
    ) return 3;

    if(
      r.includes('заместитель председателя') ||
      r.includes('зам председателя') ||
      r.includes('зам председ')
    ) return 2;

    if(
      r==='председатель' ||
      r.includes('председатель студсовета') ||
      r.includes('председатель студенческого совета')
    ) return 1;

    return 100;
  };

  const rows=[...data.rows];

  if(kind==='council'){
    rows.sort((a,b)=>{
      const pa=councilPriority(getRole(a));
      const pb=councilPriority(getRole(b));

      if(pa!==pb)return pa-pb;

      return getName(a).localeCompare(
        getName(b),
        'ru',
        {sensitivity:'base'}
      );
    });
  }

  el.innerHTML=rows.map(r=>{
    const name=getName(r);
    const role=getRole(r);

    return `<div class="row-card">
      ${avatarHtml(name,r['Фото']||r.photoUrl||'')}
      <span class="row-main">
        <b>${esc(name)}</b>
        <small>${esc(role)}</small>
        ${r['Комната']?`<small>Комната ${esc(r['Комната'])}</small>`:''}
      </span>
    </div>`;
  }).join('');
}

function roomOptions(selected){ return (state.rooms||[]).map(r=>`<option value="${esc(r)}" ${String(r)===String(selected)?'selected':''}>${esc(r)}</option>`).join(''); }
function openAddStudent(room=''){
  if(!canManage())return toast('Недостаточно прав');
  showModal(`<div class="sheet-handle"></div><h3>Заселить студента</h3><div class="field"><label>ФИО</label><input id="f_fio" autocomplete="off"></div><div class="field"><label>Комната</label><select id="f_room"><option value="">Выберите комнату</option>${roomOptions(room)}</select></div><div class="field"><label>ИИН / паспорт</label><input id="f_iin" autocomplete="off"></div><div class="field"><label>Факультет</label><input id="f_faculty"></div><div class="field"><label>Дата заселения</label><input id="f_dateIn" placeholder="01.09.2026"></div><div class="field"><label>Дата рождения</label><input id="f_birthDate" placeholder="15.03.2007"></div><div class="field"><label>Прописка</label><input id="f_registration"></div><button class="btn btn-primary btn-wide" onclick="saveNewStudent()">Заселить</button><button class="btn btn-secondary btn-wide" onclick="closeModal()">Отмена</button>`);
}
async function saveNewStudent(){
  try{
    await apiRequest('appAddStudent',[state.initData,{fio:$('#f_fio').value,room:$('#f_room').value,iin:$('#f_iin').value,faculty:$('#f_faculty').value,dateIn:$('#f_dateIn').value,birthDate:$('#f_birthDate').value,registration:$('#f_registration').value}],{ttl:0,force:true});
    closeModal(); toast('Студент добавлен'); await refreshAfterMutation(); render(state.currentPage==='rooms'?'rooms':'home');
  }catch(e){toast(e.message)}
}
let quickMoveTimer=null;

function openQuickMove(){
  if(!canManage()){
    return toast(
      'Недостаточно прав для переселения'
    );
  }

  showModal(`<div class="sheet-handle"></div>
    <div class="quick-move-head">
      <span class="quick-move-icon">${icon('swap')}</span>
      <div>
        <small>Быстрое действие</small>
        <h3>Переселить студента</h3>
      </div>
    </div>

    <div class="field">
      <label>Найти студента</label>
      <input
        id="quickMoveQuery"
        autocomplete="off"
        placeholder="ФИО, ИИН или комната"
        oninput="quickMoveInput(this.value)"
      >
      <small>Введите минимум 2 символа.</small>
    </div>

    <div
      id="quickMoveResults"
      class="quick-move-results"
    >
      <div class="quick-move-empty">
        Начните вводить ФИО, ИИН или номер комнаты.
      </div>
    </div>

    <button
      class="btn btn-secondary btn-wide"
      onclick="closeModal()"
    >
      Закрыть
    </button>
  `);

  setTimeout(
    ()=>$('#quickMoveQuery')?.focus(),
    80
  );
}

function quickMoveInput(value){
  clearTimeout(quickMoveTimer);

  const query=
    String(value||'').trim();

  const target=
    $('#quickMoveResults');

  if(!target)return;

  if(query.length<2){
    target.innerHTML=
      '<div class="quick-move-empty">Введите минимум 2 символа.</div>';

    return;
  }

  target.innerHTML=
    '<div class="task-center-loading">Ищем студента…</div>';

  quickMoveTimer=setTimeout(
    ()=>quickMoveSearch(query),
    220
  );
}

async function quickMoveSearch(query){
  const target=
    $('#quickMoveResults');

  if(!target)return;

  try{
    const list=await apiRequest(
      'appSearchStudents',
      [state.initData,query],
      {ttl:0,force:true}
    );

    const active=
      (list||[]).filter(
        student=>
          student.active!==false
      );

    indexStudents(active);

    if(!active.length){
      target.innerHTML=
        '<div class="quick-move-empty">Заселённый студент не найден.</div>';

      return;
    }

    target.innerHTML=
      active.slice(0,12).map(
        student=>`
          <button
            class="quick-move-student"
            type="button"
            onclick="quickMoveChoose(${Number(student.rowNumber)})"
          >
            <span class="avatar">
              ${esc(initials(student.fio))}
            </span>

            <span class="quick-move-copy">
              <b>${esc(student.fio)}</b>
              <small>
                Комната ${esc(student.room||'—')}
                ·
                ${esc(student.faculty||'факультет не указан')}
              </small>
            </span>

            <span class="mini-chevron">
              ${icon('chevron')}
            </span>
          </button>
        `
      ).join('');

  }catch(e){
    target.innerHTML=
      `<div class="quick-move-empty">${esc(e.message)}</div>`;
  }
}

function quickMoveChoose(row){
  closeModal();

  setTimeout(
    ()=>openMove(row),
    70
  );
}

function openMove(row){
  const s=state.studentMap.get(Number(row)); if(!s)return toast('Данные студента не загружены');
  showModal(`<div class="sheet-handle"></div><h3>Переселить</h3><p><b>${esc(s.fio)}</b><br><span style="color:var(--muted);font-size:12px">Текущая комната: ${esc(s.room||'—')}</span></p><div class="field"><label>Новая комната</label><select id="move_room"><option value="">Выберите комнату</option>${roomOptions('')}</select></div><button class="btn btn-primary btn-wide" onclick="saveMove(${row})">Подтвердить переселение</button><button class="btn btn-secondary btn-wide" onclick="closeModal()">Отмена</button>`);
}
async function saveMove(row){ try{await apiRequest('appMoveStudent',[state.initData,row,$('#move_room').value],{ttl:0,force:true});closeModal();toast('Студент переселён');await refreshAfterMutation();render('students');}catch(e){toast(e.message)} }
function confirmEvict(row){ const s=state.studentMap.get(Number(row)); showModal(`<div class="sheet-handle"></div><h3>Подтвердить выселение?</h3><p><b>${esc(s?.fio||'Студент')}</b></p><p style="color:var(--muted);font-size:12px">Действие будет записано в журнал.</p><button class="btn btn-danger btn-wide" onclick="doEvict(${row})">Выселить</button><button class="btn btn-secondary btn-wide" onclick="closeModal()">Отмена</button>`); }
async function doEvict(row){ try{await apiRequest('appEvictStudent',[state.initData,row],{ttl:0,force:true});closeModal();toast('Студент выселен');await refreshAfterMutation();render('students');}catch(e){toast(e.message)} }
async function refreshAfterMutation(){
  invalidateData();
  try{ const data=await apiRequest('appBootstrap',[state.initData],{ttl:0,force:true}); state.dashboard=data.dashboard;state.analytics=data.analytics;state.rooms=data.rooms||state.rooms; }catch(e){}
  prefetchCore();
}

function showModal(html){ $('#modalSheet').innerHTML=html; $('#modal').classList.remove('hidden'); document.body.style.overflow='hidden'; }
function closeModal(){ $('#modal').classList.add('hidden'); document.body.style.overflow=''; }

function updateSeenKey(){ return 'campus-update-seen-version'; }

function versionParts(v){
  return String(v||'0').split('.').map(n=>parseInt(n,10)||0);
}
function isNewerVersion(a,b){
  const x=versionParts(a),y=versionParts(b);
  for(let i=0;i<Math.max(x.length,y.length);i++){
    const av=x[i]||0,bv=y[i]||0;
    if(av>bv)return true;
    if(av<bv)return false;
  }
  return false;
}
function hasRemoteUpdate(){
  return !!(state.remoteManifest?.version && isNewerVersion(state.remoteManifest.version,APP_VERSION));
}
function updateUpdatesBadge(){
  const dot=$('#updatesDot');
  if(!dot)return;
  const seen=localStorage.getItem(updateSeenKey())||'';
  const localUnseen=seen!==UPDATE_CENTER_VERSION;
  dot.classList.toggle('hidden',!localUnseen && !hasRemoteUpdate());
}
function markUpdatesSeen(){
  try{ localStorage.setItem(updateSeenKey(),UPDATE_CENTER_VERSION); }catch(e){}
  updateUpdatesBadge();
}

const AUTO_UPDATE_CHECK_MS = 60000;
const AUTO_UPDATE_RETRY_GUARD_MS = 180000;
let autoUpdateWatchTimer = null;
let autoUpdateInstalling = false;

function autoUpdateAttemptKey(){
  return 'campus-auto-update-attempt-v2';
}

function readAutoUpdateAttempt(){
  try{
    const raw=localStorage.getItem(autoUpdateAttemptKey());
    return raw ? JSON.parse(raw) : null;
  }catch(e){
    return null;
  }
}

function clearFinishedAutoUpdateAttempt(){
  try{
    const attempt=readAutoUpdateAttempt();

    if(
      attempt?.target &&
      !isNewerVersion(
        String(attempt.target),
        APP_VERSION
      )
    ){
      localStorage.removeItem(
        autoUpdateAttemptKey()
      );
    }
  }catch(e){}
}

function showAutomaticUpdateOverlay(version){
  let layer=$('#autoUpdateOverlay');

  if(!layer){
    layer=document.createElement('section');
    layer.id='autoUpdateOverlay';
    layer.className='auto-update-overlay-v1312';
    layer.setAttribute('role','status');
    document.body.appendChild(layer);
  }

  layer.innerHTML=`<div class="auto-update-card-v1312">
    <span class="auto-update-icon-v1312">${icon('spark')}</span>
    <div>
      <small>Доступно обновление</small>
      <h3>Обновляем Campus №1</h3>
      <p>Версия ${esc(version)} установится автоматически. Ничего нажимать не нужно.</p>
    </div>
    <span class="auto-update-spinner-v1312"></span>
  </div>`;
}

function maybeAutoInstallRemoteUpdate(manifest){
  if(autoUpdateInstalling)return false;

  if(
    !manifest?.version ||
    !isNewerVersion(
      String(manifest.version),
      APP_VERSION
    )
  ){
    return false;
  }

  if(document.hidden)return false;

  const target=String(manifest.version);
  const now=Date.now();
  const previous=readAutoUpdateAttempt();

  if(
    previous?.target===target &&
    now-Number(previous.at||0)<
      AUTO_UPDATE_RETRY_GUARD_MS
  ){
    return false;
  }

  try{
    localStorage.setItem(
      autoUpdateAttemptKey(),
      JSON.stringify({
        target,
        from:APP_VERSION,
        at:now
      })
    );
  }catch(e){}

  autoUpdateInstalling=true;
  showAutomaticUpdateOverlay(target);

  setTimeout(()=>{
    const url=
      CLOUD_APP_URL+
      '?v='+encodeURIComponent(target)+
      '&autoupdate=1&cb='+Date.now();

    location.replace(url);
  },1100);

  return true;
}

function startAutomaticUpdateWatch(){
  clearFinishedAutoUpdateAttempt();

  if(autoUpdateWatchTimer)return;

  autoUpdateWatchTimer=setInterval(()=>{
    if(
      !document.hidden &&
      !autoUpdateInstalling
    ){
      checkRemoteUpdate(true);
    }
  },AUTO_UPDATE_CHECK_MS);
}

function checkUpdateWhenVisible(){
  if(document.hidden || autoUpdateInstalling)return;

  if(
    Date.now()-
      Number(state.updateCheckTime||0)>
      15000
  ){
    checkRemoteUpdate(true);
  }
}

async function checkRemoteUpdate(silent=false){
  try{
    const response=await fetch(
      UPDATE_MANIFEST_URL+'?t='+Date.now(),
      {
        cache:'no-store',
        headers:{
          'cache-control':'no-cache',
          'pragma':'no-cache'
        }
      }
    );

    if(!response.ok){
      throw new Error(
        'HTTP '+response.status
      );
    }

    const manifest=await response.json();

    if(!manifest || !manifest.version){
      throw new Error(
        'Некорректный manifest'
      );
    }

    state.remoteManifest=manifest;
    state.updateCheckTime=Date.now();

    updateUpdatesBadge();

    if(hasRemoteUpdate()){
      maybeAutoInstallRemoteUpdate(
        manifest
      );
    }

    return manifest;

  }catch(e){
    if(!silent){
      toast(
        'Не удалось проверить обновления'
      );
    }

    return null;
  }
}
function renderUpdateItem(update){
  return `<article class="update-card ${update.latest?'latest':''}">
    <div class="update-card-head">
      <div>
        <div class="update-version-row">
          <span class="update-version">v${esc(update.version)}</span>
          ${update.latest?'<span class="update-latest">Последнее</span>':''}
        </div>
        <h4>${esc(update.title)}</h4>
      </div>
      <time>${esc(update.date)}</time>
    </div>
    <ul>${(update.items||[]).map(item=>`<li>${esc(item)}</li>`).join('')}</ul>
  </article>`;
}
function remoteUpdateCard(){
  const m=state.remoteManifest;
  if(!m)return `<div class="cloud-update-status"><span class="cloud-status-dot"></span><span><b>Cloud Update включён</b><small>Новая версия проверяется через GitHub</small></span></div>`;
  if(!hasRemoteUpdate()){
    return `<div class="cloud-update-status ok"><span class="cloud-status-dot"></span><span><b>Установлена последняя версия</b><small>Campus №1 v${esc(APP_VERSION)} актуален</small></span></div>`;
  }
  const notes=Array.isArray(m.notes)?m.notes:[];
  return `<div class="cloud-update-card">
    <div class="cloud-update-head">
      <span class="cloud-update-icon">${icon('spark')}</span>
      <span><small>Доступно обновление</small><b>Campus №1 v${esc(m.version)}</b></span>
    </div>
    ${m.title?`<div class="cloud-update-title">${esc(m.title)}</div>`:''}
    ${notes.length?`<ul>${notes.slice(0,5).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
    <button class="btn btn-primary btn-wide" type="button" onclick="installRemoteUpdate()">Обновить сейчас</button>
  </div>`;
}
async function showWhatsNew(){
  haptic('light');
  await checkRemoteUpdate(true);
  markUpdatesSeen();
  showModal(`<div class="sheet-handle"></div>
    <div class="updates-sheet-head">
      <div>
        <div class="updates-kicker">Campus №1</div>
        <h3>Обновления</h3>
        <p>Версия приложения и последние изменения.</p>
      </div>
      <span class="updates-current">v${esc(APP_VERSION)}</span>
    </div>
    ${remoteUpdateCard()}
    <div class="updates-list">
      ${CAMPUS_UPDATES.map(renderUpdateItem).join('')}
    </div>
    <div class="updates-footer">Cloud Update проверяет GitHub. После публикации новой версии её можно установить прямо с телефона.</div>
    <button class="btn btn-secondary btn-wide" onclick="checkUpdatesFromSheet()">Проверить ещё раз</button>
    <button class="btn btn-secondary btn-wide" onclick="closeModal()">Закрыть</button>`);
}
async function checkUpdatesFromSheet(){
  const m=await checkRemoteUpdate(false);
  closeModal();
  if(m)setTimeout(showWhatsNew,80);
}
function installRemoteUpdate(){
  const manifest=state.remoteManifest;

  if(!manifest?.version)return;

  try{
    localStorage.removeItem(
      autoUpdateAttemptKey()
    );
  }catch(e){}

  maybeAutoInstallRemoteUpdate(
    manifest
  );
}

function showProfile(){
  const u=state.user||{};
  const name=
    u.firstName||
    u.username||
    'Пользователь';

  showModal(`<div class="sheet-handle"></div>
    <div style="display:flex;align-items:center;gap:12px">
      ${avatarHtml(name,u.photoUrl,'avatar-large')}
      <div>
        <h3 style="margin:0 0 4px">${esc(name)}</h3>
        <span class="badge blue">${esc(roleLabel(u))}</span>
      </div>
    </div>
    <div class="kv">
      <div>
        <small>Telegram ID</small>
        <b>${esc(u.id||'—')}</b>
      </div>
      <div>
        <small>Доступ</small>
        <b>${u.canManage?'Управление':'Просмотр'}</b>
      </div>
    </div>
    <button class="btn btn-secondary btn-wide" onclick="closeModal()">Закрыть</button>`);
}

function bindGlobalEvents(){
  $$('.nav-item').forEach(btn=>{
    btn.addEventListener(
      'pointerdown',
      ()=>warmPage(btn.dataset.page),
      {passive:true}
    );

    btn.addEventListener('click',()=>{
      haptic('light');
      const page=btn.dataset.page;

      if(page===state.currentPage){
        window.scrollTo({
          top:0,
          behavior:'smooth'
        });
        return;
      }

      render(page);
    });
  });
  $('#themeBtn')?.addEventListener('click',()=>{haptic('light');toggleTheme()});
  $('#seasonBtn')?.addEventListener('click',()=>{haptic('light');openOwnerSeasonSettings()});
  $('#specialBtn')?.addEventListener('click',()=>{haptic('light');render('special')});
  $('#updatesBtn')?.addEventListener('click',showWhatsNew);
  $('#profileBtn')?.addEventListener('click',()=>{haptic('light');showProfile()});
  $('#homeLogoBtn')?.addEventListener('click',()=>{haptic('light');render('home')});
  $('#modal')?.addEventListener('click',e=>{ if(e.target?.hasAttribute('data-close-modal'))closeModal(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape')closeModal(); });

  document.addEventListener('visibilitychange',checkUpdateWhenVisible);
}

initTheme();
bindGlobalEvents();
injectIcons();
boot();


