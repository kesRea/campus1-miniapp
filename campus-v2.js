/* Campus №1 Global Update V2.0 — additive, security enforced on Apps Script. */
(function(){'use strict';
const V2={rights:{},ready:false,palette:{},online:[],importToken:'',importReport:null,roster:null,uploads:[],profiles:[],inspections:[],checking:false};
const $v=(sel)=>document.querySelector(sel), escV=(v)=>typeof esc==='function'?esc(v):String(v||'').replace(/[&<>"']/g,'');
const call=(name,...args)=>apiRequest(name,[state.initData,...args],{ttl:0,force:true});
const notice=(text)=>typeof toast==='function'?toast(text):alert(text);
const allowed=(key)=>V2.rights[key]===true;
const privileged=()=>!!(state.user?.isOwner||state.user?.isDeveloper);
const safeErr=(e)=>escV(e?.message||String(e));
const show=(html)=>{$v('#view').innerHTML=html};
const heading=(title,back='more')=>back==='v2-admin'?`<div class="page-head"><button class="back-button" onclick="v2Go('admin')">‹</button><h2>${escV(title)}</h2></div>`:pageHead(title,back);
const baseRooms=()=>[13,14,23,...Array.from({length:133},(_,i)=>i+30).filter(n=>![118,126,127].includes(n))];
const blockForRoom=(n)=>[13,14,23].includes(+n)||(+n>=30&&+n<=73)?1:+n>=74&&+n<=117?2:+n>=119&&+n<=162&&![126,127].includes(+n)?3:0;
const elAction=(title,subtitle,action)=>`<button class="v2-action" type="button" onclick="${action}"><span><strong>${escV(title)}</strong><small>${escV(subtitle)}</small></span>›</button>`;
async function reloadCapabilities(){if(!state.user)return;try{const response=await call('appV2GetCapabilities');V2.rights=response.rights||{};V2.ready=true;try{V2.palette=await call('appV2GetPalette');applyPalette();}catch(_){}decorateRole();}catch(e){V2.ready=false;console.warn('Campus V2 backend module not installed:',e);}}
function applyPalette(){Object.entries(V2.palette).forEach(([k,hex])=>{if(/^#[\da-fA-F]{6}$/.test(hex))document.documentElement.style.setProperty('--v2-'+k,hex)});}
function roleClass(u){if(u?.isOwner)return 'owner';if(u?.isDeveloper)return 'developer';return u?.position?.roleId||'member'}
function decorateRole(){const c=roleClass(state.user),tag=$v('.hero-side .role-chip');if(tag){tag.style.background=`color-mix(in srgb,var(--v2-${c},#2677d8) 15%,transparent)`;tag.style.color=`var(--v2-${c},#2677d8)`;}const splash=$v('#splashVersion');if(splash)splash.textContent='Версия '+(typeof APP_VERSION!=='undefined'?APP_VERSION:'2.0.5');}
async function tick(){if(document.hidden||!state.user||!V2.ready)return;try{await call('appV2Heartbeat')}catch(_){} }
function v2More(){if(!V2.ready)return;const grid=$v('.more-grid');if(!grid||grid.querySelector('[data-v2extra]'))return;const add=document.createElement('div');add.dataset.v2extra='1';add.style.display='contents';add.innerHTML=[allowed('inspection')?moreCard('clipboard','Проверка комнат','Оценки за вторник или четверг',"v2Go('inspections')"):'',privileged()?moreCard('shield','V2.0 Центр управления','Онлайн, разработчики, профили, роли',"v2Go('admin')"):'',privileged()?moreCard('book','Загрузка документов','Сверка и безопасное применение',"v2Go('import')"):''].join('');grid.appendChild(add);}
async function v2Analytics(){const mount=$v('#view');if(!mount||mount.querySelector('#v2-analytics'))return;const panel=document.createElement('div');panel.id='v2-analytics';panel.innerHTML='<div class="v2-panel">Аналитика по блокам загружается…</div>';mount.appendChild(panel);try{const data=await call('appV2Analytics');if(state.currentPage!=='analytics')return;const summ=(k)=>data.blocks.reduce((s,b)=>s+b[k],0);panel.innerHTML=`<div class="section-heading"><h2>Проживающие по блокам и категориям</h2></div><div class="v2-grid"><div class="v2-stat"><b>${data.total}</b><small>Всего проживает</small></div><div class="v2-stat"><b>${summ('college')}</b><small>Колледж</small></div><div class="v2-stat"><b>${summ('foundation')}</b><small>Foundation</small></div><div class="v2-stat"><b>${summ('turkmen')}</b><small>Туркмения</small></div><div class="v2-stat"><b>${summ('mongolian')}</b><small>Монголия</small></div><div class="v2-stat"><b>${data.unassigned}</b><small>Без блока</small></div></div>${data.blocks.map(b=>`<div class="v2-panel"><h3>${b.block} блок — ${b.total} проживающих</h3>${[['college','Колледж'],['foundation','Foundation'],['turkmen','Туркмения'],['mongolian','Монголия']].map(([k,n])=>`<div class="v2-line"><span>${n}</span><b>${b[k]}</b></div><div class="v2-bar"><span style="width:${b.total?Math.min(100,Math.round(b[k]/b.total*100)):0}%"></span></div>`).join('')}</div>`).join('')}<p class="v2-note">${escV(data.note)} Счёт ведётся по живой базе, а не по старому Excel.</p>`;}catch(e){panel.innerHTML=`<div class="v2-panel">${safeErr(e)}</div>`;}}
async function v2Page(which){if(!V2.ready){notice('Сначала установите серверный модуль V2.0');return;}state.currentPage='v2-'+which;state.renderSeq++;setNav('more');switch(which){case 'admin':return v2Admin();case 'online':return v2Online();case 'developers':return v2Developers();case 'palette':return v2Palette();case 'profiles':return v2Profiles();case 'roster':return v2Roster();case 'activist-roster':return v2Roster('activists');case 'inspections':return v2Inspect();case 'import':return v2Import();default:return;}}
async function v2Admin(){if(!privileged())return notice('Доступ запрещён');show(`${heading('Центр V2.0','more')}<div class="v2-panel"><h3>Глобальное обновление V2.0</h3><p class="v2-note">Доступ владельца и разработчика подтверждается сервером. Панель не видна обычным участникам.</p></div>${elAction('Пользователи онлайн','Кто сейчас в Mini App',"v2Go('online')")}${elAction('Разработчики','Список и управление доступом',"v2Go('developers')")}${elAction('Цвета ролей','Сменить цвета в настройках',"v2Go('palette')")}${elAction('Тестовые профили','Аватары и комментарии',"v2Go('profiles')")}${elAction('Привязка студсовета','Выбрать пользователя Telegram для ФИО',"v2Go('roster')")}${elAction('Привязка активистов','Связать активистов с Telegram для редактирования',"v2Go('activist-roster')")}${elAction('Загрузка документов','Excel, CSV и Word-таблицы',"v2Go('import')")}`);}
async function v2Online(){if(!privileged())return;show(heading('Сейчас в сети','v2-admin')+'<div id="v2-online" class="v2-panel">Получаем статусы…</div>');try{const data=await call('appV2OnlineUsers');V2.online=data.users||[];$v('#v2-online').innerHTML=`<h3>Онлайн: ${data.online}</h3><p class="v2-note">Онлайн — сигнал от открытого приложения за последние 90 секунд. Статусы обновляются при открытии экрана.</p>${V2.online.map(x=>`<div class="v2-line"><span><b>${escV(x.name||x.id)}</b><small class="v2-code"> ${escV(x.id)}</small></span><span class="${x.online?'v2-online':'v2-offline'}">${x.online?'● В сети':'Был '+Math.round(x.secondsAgo/60)+' мин. назад'}</span></div>`).join('')||'Никто пока не открыл приложение'}<button class="btn btn-secondary btn-wide" onclick="v2Go('online')">Обновить</button>`;}catch(e){$v('#v2-online').textContent=e.message;}}
async function v2Developers(){if(!privileged())return;show(heading('Разработчики','v2-admin')+'<div id="v2-devs" class="v2-panel">Загружаем…</div>');try{const r=await call('appV2Developers');const list=r.developers||[];$v('#v2-devs').innerHTML=`<h3>Разработчиков: ${r.count}</h3>${list.map(u=>`<div class="v2-line"><span><b>${escV(u.name||u.id)}</b><small> ${u.username?'@'+escV(u.username):escV(u.id)}</small></span>${r.canEdit&&u.id!=='7272434463'?`<button class="btn btn-secondary" onclick="v2DeveloperChange('${escV(u.id)}',false)">Убрать</button>`:''}</div>`).join('')}${r.canEdit?`<label>Добавить Telegram ID (сначала одобрить доступ через бота)</label><input class="v2-input" id="v2-new-dev" inputmode="numeric" placeholder="Telegram ID"><button class="btn btn-primary btn-wide" onclick="v2DeveloperChange(document.querySelector('#v2-new-dev').value,true)">Добавить разработчика</button>`:''}<p class="v2-note">Основной разработчик защищён от случайного удаления. Выдача прав доступна только владельцу.</p>`;}catch(e){$v('#v2-devs').textContent=e.message;}}
async function v2DeveloperChange(id,enabled){if(!confirm(enabled?'Назначить разработчика? Он получит специальные права.':'Отозвать права разработчика?'))return;try{await call('appV2SetDeveloper',id,enabled);notice('Сохранено');v2Developers();}catch(e){notice(e.message)}}
async function v2Palette(){if(!privileged())return;show(heading('Цвета ролей','v2-admin')+'<div id="v2-palette" class="v2-panel">Загружаем…</div>');try{V2.palette=await call('appV2GetPalette');applyPalette();const labels={owner:'Владелец · красный',developer:'Разработчик · золотой',chair:'Председатель · зелёный',vice_chair:'Заместитель председателя · зелёный',sector_head:'Глава сектора · жёлтый',sector_deputy:'Заместитель главы · жёлтый',member:'Участник · синий',activist:'Активист · синий'};$v('#v2-palette').innerHTML=`<h3>Настройка цвета каждой должности</h3><div class="v2-colors">${Object.entries(V2.palette).map(([k,v])=>`<label>${labels[k]||escV(k)}</label><input type="color" value="${escV(v)}" onchange="v2SetRoleColor('${escV(k)}',this.value)">`).join('')}</div><p class="v2-note">Сохраняется для всех пользователей на сервере. Назначать роли могут только владелец и разработчик.</p>`;}catch(e){$v('#v2-palette').textContent=e.message;}}
async function v2SetRoleColor(key,hex){try{V2.palette=await call('appV2SetPalette',key,hex);applyPalette();decorateRole();notice('Цвет сохранён');}catch(e){notice(e.message)}}
async function v2Roster(kind='council'){if(!privileged())return;show(heading((kind==='activists'?'Активисты':'Студсовет')+' · привязка Telegram','v2-admin')+'<div class="v2-panel" id="v2-roster">Получаем список…</div>');try{V2.roster=await call('appV2Roster',kind);$v('#v2-roster').innerHTML=`<p class="v2-note">Выбирайте Telegram-аккаунт для каждой записи. Аватар Telegram и @ник загрузятся из профиля. Права зависят от состава: студсовет управляет заселением, активисты редактируют данные.</p>${V2.roster.roster.map(x=>`<div class="v2-panel"><strong>${escV(x.name)}</strong><small> · ${escV(x.role)}</small><select class="v2-select" id="v2-link-${x.row}"><option value="">Без привязки</option>${V2.roster.users.map(u=>`<option value="${escV(u.id)}" ${u.id===x.telegramId?'selected':''}>${escV(u.name)} ${u.username?'(@'+escV(u.username)+')':''} · ${escV(u.id)}</option>`).join('')}</select><button class="btn btn-secondary btn-wide" onclick="v2RosterLink(${x.row},'${kind}')">Сохранить привязку</button></div>`).join('')||'В этом списке нет записей.'}`;}catch(e){$v('#v2-roster').textContent=e.message;}}
async function v2RosterLink(row,kind='council'){const value=$v('#v2-link-'+row)?.value??'';if(!confirm('Привязать выбранного пользователя к этой записи студсовета?'))return;try{await call('appV2BindRosterUser',row,value,kind);notice('Привязка сохранена');v2Roster(kind);}catch(e){notice(e.message)}}
async function v2Profiles(){if(!privileged())return;show(heading('Тестовые профили','v2-admin')+'<div id="v2-profiles" class="v2-panel">Загружаем…</div>');try{V2.profiles=await call('appV2Profiles');$v('#v2-profiles').innerHTML=`<p class="v2-note">Только владелец и разработчики. Профили, аватары и комментарии не публикуются в GitHub.</p>${V2.profiles.map(p=>`<div class="v2-panel"><div class="v2-profile-head"><img class="v2-profile-photo" alt="" src="${escV(p.photoUrl||'')}" onerror="this.style.visibility='hidden'"><div><b>${escV(p.name)}</b><div>${p.username?'@'+escV(p.username):''}</div><span class="v2-tag ${p.role==='Владелец'?'owner':'developer'}">${escV(p.role)}</span></div></div><p>${escV(p.about||'Нет описания')}</p>${p.mine?`<label>О себе</label><textarea class="v2-textarea" id="v2-about" maxlength="360">${escV(p.about||'')}</textarea><label>Загрузить новую аватарку JPG/PNG</label><input class="v2-input" type="file" id="v2-avatar" accept="image/png,image/jpeg,image/webp"><button class="btn btn-primary btn-wide" onclick="v2SaveProfile()">Сохранить профиль</button>`:''}<h3>Комментарии</h3><div class="v2-comms">${(p.comments||[]).map(c=>`<p>${escV(c.text)} <small>· ${escV(c.author)} · ${escV(c.date)}</small></p>`).join('')||'<p>Пока нет комментариев</p>'}</div><textarea class="v2-textarea" id="v2-comment-${escV(p.id)}" maxlength="500" placeholder="Написать комментарий"></textarea><button class="btn btn-secondary btn-wide" onclick="v2Comment('${escV(p.id)}')">Отправить</button></div>`).join('')}`;}catch(e){$v('#v2-profiles').textContent=e.message;}}
function v2AvatarToData(file){return new Promise((res,rej)=>{if(!file)return res('');if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>7*1024*1024)return rej(new Error('Нужно изображение JPG/PNG/WebP до 7 МБ.'));const image=new Image(),url=URL.createObjectURL(file);image.onload=()=>{try{const c=document.createElement('canvas');c.width=256;c.height=256;const ctx=c.getContext('2d');const sz=Math.min(image.width,image.height),x=(image.width-sz)/2,y=(image.height-sz)/2;ctx.drawImage(image,x,y,sz,sz,0,0,256,256);let q=.77,data=c.toDataURL('image/jpeg',q);while(data.length>40000&&q>.35){q-=.1;data=c.toDataURL('image/jpeg',q);}URL.revokeObjectURL(url);if(data.length>42000)throw new Error('Фото не удалось сжать — выберите другое.');res(data);}catch(e){URL.revokeObjectURL(url);rej(e)}};image.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('Не удалось прочитать фото.'))};image.src=url;});}
async function v2SaveProfile(){try{const avatar=await v2AvatarToData($v('#v2-avatar')?.files?.[0]);await call('appV2SaveMyProfile',$v('#v2-about')?.value||'',avatar);notice('Профиль обновлён');v2Profiles();}catch(e){notice(e.message)}}
async function v2Comment(id){try{const el=$v('#v2-comment-'+id),v=el?.value?.trim();if(!v)return;await call('appV2ProfileComment',id,v);notice('Комментарий опубликован');v2Profiles();}catch(e){notice(e.message)}}
function v2Weekday(d){return ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][new Date(d+'T12:00:00').getDay()];}
function v2Today(){const now=new Date(),y=now.getFullYear(),m=String(now.getMonth()+1).padStart(2,'0'),d=String(now.getDate()).padStart(2,'0');return `${y}-${m}-${d}`;}
function v2Inspect(){if(!allowed('inspection'))return notice('Доступ к проверкам закрыт');show(`${heading('Чистый вторник / четверг','more')}<div class="v2-panel"><p class="v2-note">Оценки сразу по всему выбранному блоку. Выберите группу этажей 1–2 или 3–4, затем оцените посещённые комнаты. Нумерация комнат не определяет этаж автоматически.</p><label>Дата проверки</label><input type="date" id="v2-check-date" class="v2-input" value="${v2Today()}" onchange="v2CheckLoad()"><label>Блок</label><select id="v2-check-block" class="v2-select" onchange="v2CheckLoad()"><option value="1">1 блок</option><option value="2">2 блок</option><option value="3">3 блок</option></select><label>Этажи</label><select id="v2-check-band" class="v2-select" onchange="v2CheckLoad()"><option value="1–2">1–2 этажи</option><option value="3–4">3–4 этажи</option></select><div id="v2-cleaning-caption" class="v2-note"></div></div><div class="v2-panel"><h3>Выбрать комнаты и проставить оценки</h3><p class="v2-note">Пустая оценка означает «не проверено». Для каждой комнаты можно оставить замечание.</p><div id="v2-check-rooms" class="v2-rooms"></div><button class="btn btn-primary btn-wide" onclick="v2CheckSave()">Сохранить все оценки</button></div>`);v2CheckLoad();}
async function v2CheckLoad(){const d=$v('#v2-check-date')?.value,block=+($v('#v2-check-block')?.value||1),band=$v('#v2-check-band')?.value;const cap=$v('#v2-cleaning-caption');if(!cap)return;const day=v2Weekday(d);cap.textContent=`${day==='Вт'?'Чистый вторник':day==='Чт'?'Чистый четверг':day+' — оценки доступны только за вторник/четверг'}.`;const roomEl=$v('#v2-check-rooms');roomEl.innerHTML='<small>Загрузка оценок…</small>';try{V2.inspections=await call('appV2GetInspections',d,block,band);}catch(e){V2.inspections=[];notice(e.message);}if(!$v('#v2-check-rooms'))return;const map=new Map(V2.inspections.map(x=>[x.room,x]));roomEl.innerHTML=baseRooms().filter(n=>blockForRoom(n)===block).map(room=>{const old=map.get(room)||{};return `<div class="v2-room" data-room="${room}"><b>Комната ${room}</b><select aria-label="Оценка комнаты ${room}" class="v2-score"><option value="">Не проверена</option>${[5,4,3,2,1].map(v=>`<option value="${v}" ${Number(old.rating)===v?'selected':''}>${v} / 5</option>`).join('')}</select><textarea maxlength="350" class="v2-room-note" placeholder="Замечание">${escV(old.note||'')}</textarea></div>`}).join('');}
async function v2CheckSave(){const date=$v('#v2-check-date')?.value,block=+$v('#v2-check-block')?.value,band=$v('#v2-check-band')?.value;const rows=[...document.querySelectorAll('#v2-check-rooms .v2-room')].filter(x=>x.querySelector('.v2-score')?.value).map(x=>({room:+x.dataset.room,rating:+x.querySelector('.v2-score').value,note:x.querySelector('textarea').value}));if(!rows.length)return notice('Сначала выберите оценки хотя бы для одной комнаты.');if(!confirm(`Сохранить ${rows.length} оценок за ${date}, блок ${block}, этажи ${band}?`))return;try{const r=await call('appV2SaveInspections',{date,block,band,items:rows});notice('Сохранено: '+r.saved+' комнат');v2CheckLoad();}catch(e){notice(e.message)}}
function v2Import(){if(!privileged())return notice('Загрузка документов доступна владельцу и разработчику');V2.importToken='';V2.importReport=null;show(`${heading('Загрузка документов','more')}<div class="v2-panel"><h3>Сверка студентов с базой</h3><p class="v2-note">Загрузите Excel (.xlsx), CSV или Word (.docx) с таблицей. Будут найдены однозначные совпадения, исправлены лишние пробелы в полях и посчитаны различия. Новые студенты, несовпадающие ФИО и переселения требуют ручной проверки; ничего не удаляется автоматически.</p><input class="v2-input" type="file" id="v2-upload" accept=".xlsx,.csv,.docx,text/csv" onchange="v2ReadDocument()"><div id="v2-import-check"></div></div>`);}
function v2ColumnIndex(ref){const s=String(ref||'').match(/^[A-Z]+/i)?.[0]||'';return [...s.toUpperCase()].reduce((a,c)=>a*26+c.charCodeAt(0)-64,0)-1;}
async function v2Unzip(file){const data=await file.arrayBuffer(),u=new Uint8Array(data),v=new DataView(data),d=new TextDecoder('utf-8');let e=-1;for(let i=u.length-22;i>=Math.max(0,u.length-65557);i--){if(v.getUint32(i,true)===0x06054b50){e=i;break}}if(e<0)throw new Error('Файл не является ZIP/Excel/Word или повреждён.');const count=v.getUint16(e+10,true),start=v.getUint32(e+16,true),files={};let p=start;for(let i=0;i<count;i++){if(v.getUint32(p,true)!==0x02014b50)throw new Error('Повреждена структура файла.');const method=v.getUint16(p+10,true),comp=v.getUint32(p+20,true),nameLen=v.getUint16(p+28,true),extra=v.getUint16(p+30,true),comment=v.getUint16(p+32,true),offset=v.getUint32(p+42,true),name=d.decode(u.slice(p+46,p+46+nameLen));files[name]={method,comp,offset};p+=46+nameLen+extra+comment;}async function read(name){const f=files[name];if(!f)return null;const pos=f.offset;if(v.getUint32(pos,true)!==0x04034b50)throw new Error('Повреждён ZIP-файл.');const begin=pos+30+v.getUint16(pos+26,true)+v.getUint16(pos+28,true),raw=u.slice(begin,begin+f.comp);if(f.method===0)return d.decode(raw);if(f.method!==8||typeof DecompressionStream==='undefined')throw new Error('Устройство не поддерживает этот формат ZIP. Сохраните CSV.');const stream=new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));return d.decode(await new Response(stream).arrayBuffer());}return {read,files:Object.keys(files)};}
function v2XML(str){const xml=new DOMParser().parseFromString(str,'text/xml');if(xml.getElementsByTagName('parsererror').length)throw new Error('Некорректный XML документа.');return xml;}
async function v2XlsxRows(file){const zip=await v2Unzip(file),wb=v2XML(await zip.read('xl/workbook.xml')),rels=v2XML(await zip.read('xl/_rels/workbook.xml.rels'));let target='',sheets=[...wb.getElementsByTagName('sheet')],chosen=sheets.find(x=>/новый список/i.test(x.getAttribute('name')||''))||sheets.find(x=>/студент|база данных/i.test(x.getAttribute('name')||''))||sheets[0];if(!chosen)throw new Error('В Excel нет листов.');const relId=chosen.getAttribute('r:id')||chosen.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');const rel=[...rels.getElementsByTagName('Relationship')].find(x=>x.getAttribute('Id')===relId);if(!rel)throw new Error('Не удалось найти лист Excel.');target=rel.getAttribute('Target').replace(/^\//,'').replace(/^\.\.\//,'');if(!target.startsWith('xl/'))target='xl/'+target;const sheet=await zip.read(target);if(!sheet)throw new Error('Лист не найден в архиве.');const shared=await zip.read('xl/sharedStrings.xml');const dict=shared?[...v2XML(shared).getElementsByTagName('si')].map(x=>[...x.getElementsByTagName('t')].map(z=>z.textContent).join('')):[];const xml=v2XML(sheet);return [...xml.getElementsByTagName('row')].slice(0,850).map(row=>{const cells=[...row.getElementsByTagName('c')],out=[];cells.forEach(c=>{const i=v2ColumnIndex(c.getAttribute('r'));if(i<0||i>100)return;const value=c.getElementsByTagName('v')[0]?.textContent||'',inline=c.getElementsByTagName('is')[0];out[i]=c.getAttribute('t')==='s'?dict[+value]||'':inline?[...inline.getElementsByTagName('t')].map(x=>x.textContent).join(''):value;});return out.map(x=>x??'');});}
function v2CsvRows(text){text=String(text||'').replace(/^\uFEFF/,'');const first=text.split(/\r?\n/).find(Boolean)||'';const sep=[';',',','\t'].sort((a,b)=>first.split(b).length-first.split(a).length)[0];const rows=[];let row=[],cell='',quote=false;for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quote&&text[i+1]==='"'){cell+='"';i++;}else quote=!quote;}else if(ch===sep&&!quote){row.push(cell);cell='';}else if((ch==='\n'||ch==='\r')&&!quote){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}else cell+=ch;}if(cell||row.length){row.push(cell);rows.push(row);}return rows;}
async function v2DocxRows(file){const zip=await v2Unzip(file),xml=v2XML(await zip.read('word/document.xml'));const w='http://schemas.openxmlformats.org/wordprocessingml/2006/main';return [...xml.getElementsByTagNameNS(w,'tr')].slice(0,850).map(tr=>[...tr.getElementsByTagNameNS(w,'tc')].map(tc=>[...tc.getElementsByTagNameNS(w,'t')].map(x=>x.textContent).join(' ').trim()));}
function v2RowObjects(rows){const norm=x=>String(x||'').toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();const at=rows.findIndex((r)=>{const t=r.map(norm);return t.some(x=>x==='фио'||x.includes('ф.и.о')||x.includes('фамилия'))&&t.some(x=>x.includes('комнат')||x.includes('инн')||x.includes('иин')||x.includes('факультет')||x.includes('группа'));});if(at<0)throw new Error('Не найден заголовок «ФИО» с колонками данных.');const head=rows[at].map(norm);const idx=(...words)=>head.findIndex(h=>words.some(w=>h.includes(w)));const iF=idx('фио','ф.и.о','фамилия'),iI=idx('иин','паспорт','удостоверение'),iR=idx('комнат'),iC=idx('факультет','направление','группа'),iP=idx('прописка','регистрац');const data=rows.slice(at+1).map(row=>({fio:String(row[iF]||'').trim(),iin:iI<0?'':String(row[iI]||'').trim(),room:iR<0?'':String(row[iR]||'').trim(),faculty:iC<0?'':String(row[iC]||'').trim(),registration:iP<0?'':String(row[iP]||'').trim()})).filter(x=>x.fio);if(data.length>800)throw new Error('Более 800 студентов — разделите файл.');if(!data.length)throw new Error('Под заголовками нет студентов.');return data;}
async function v2ReadDocument(){const file=$v('#v2-upload')?.files?.[0],mount=$v('#v2-import-check');if(!file||!mount)return;if(file.size>9*1024*1024){mount.textContent='Файл слишком большой (до 9 МБ).';return;}mount.innerHTML='<div class="v2-note">Разбираем файл и сверяем с текущей базой…</div>';try{const ext=file.name.toLowerCase().split('.').pop();let rows;if(ext==='xlsx')rows=await v2XlsxRows(file);else if(ext==='csv')rows=v2CsvRows(await file.text());else if(ext==='docx')rows=await v2DocxRows(file);else throw new Error('Поддерживаются только XLSX, CSV, DOCX с таблицей. PDF — после преобразования в Excel.');const records=v2RowObjects(rows);V2.importReport=await call('appV2PreviewImport',records);V2.importToken=V2.importReport.token;const r=V2.importReport;mount.innerHTML=`<h3>Результат сверки: ${r.submitted} строк</h3><div class="v2-grid"><div class="v2-stat"><b>${r.safeUpdates}</b><small>Однозначные исправления</small></div><div class="v2-stat"><b>${r.unchanged}</b><small>Без изменений</small></div><div class="v2-stat"><b>${r.reviewCount}</b><small>Нужна проверка</small></div><div class="v2-stat"><b>${r.duplicates}</b><small>Дубли в файле</small></div></div><div class="v2-import-result">${r.review.map(x=>`<div class="v2-line"><span>${escV(x.name)} <small>строка ${x.line}</small></span><small class="v2-danger">${escV(x.kind)}</small></div>`).join('')||'<p class="v2-ok">Спорных записей нет.</p>'}</div><p class="v2-note">${escV(r.notice)}</p>${r.reviewCount===0&&r.duplicates===0?`<button class="btn btn-primary btn-wide" onclick="v2CommitImport()">Подтвердить ${r.safeUpdates} исправлений</button>`:'<div class="v2-danger">Автоматическая запись заблокирована: есть спорные записи. Исправьте исходную таблицу и загрузите снова.</div>'}`;}catch(e){V2.importToken='';mount.innerHTML=`<p class="v2-danger">${safeErr(e)}</p>`;}}
async function v2CommitImport(){if(!V2.importToken||!V2.importReport)return;const count=V2.importReport.safeUpdates;if(!confirm(`Сохранить ${count} исправлений в живую базу? Сначала будет сделана резервная копия. Комнаты не меняются.`))return;try{const r=await call('appV2ApplyImport',V2.importToken);notice(`Изменено: ${r.changed}. Резервная копия: ${r.backup||'не требуется'}`);V2.importToken='';v2Import();}catch(e){notice(e.message)}}
async function v2DeleteTask(taskId){if(!allowed('delete_task'))return notice('Удалять задачи может только студсовет');if(!confirm('Удалить задачу из активного списка? Копия останется в архиве и журнале.'))return;try{await call('appV2DeleteTask',taskId);notice('Задача перенесена в архив');if(typeof renderTasksSilently==='function')await renderTasksSilently();render('tasks');}catch(e){notice(e.message)}}
const oldMore=renderMore;renderMore=function(){oldMore();v2More();decorateRole()};
const oldAnalytics=renderAnalytics;renderAnalytics=function(){oldAnalytics();v2Analytics()};
const oldHome=renderHome;renderHome=function(){oldHome();decorateRole();const grid=$v('.action-grid');if(grid){if(!allowed('add'))grid.querySelectorAll('button[onclick*=\"openAddStudent\"]').forEach(n=>n.remove());if(!allowed('move'))grid.querySelectorAll('button[onclick*=\"openQuickMove\"]').forEach(n=>n.remove());if(allowed('inspection'))grid.insertAdjacentHTML('beforeend',actionCard('clipboard','Проверка комнат','Чистый вторник и четверг',"v2Go('inspections')"));}};
const originalAdd=openAddStudent;openAddStudent=function(){if(!allowed('add'))return notice('Заселение доступно только студсовету.');return originalAdd(...arguments);};
const originalMove=openMove;openMove=function(){if(!allowed('move'))return notice('Переселение доступно только студсовету.');return originalMove(...arguments);};
const originalQuickMove=openQuickMove;openQuickMove=function(){if(!allowed('move'))return notice('Переселение доступно только студсовету.');return originalQuickMove(...arguments);};
const originalEvict=confirmEvict;confirmEvict=function(){if(!allowed('evict'))return notice('Выселение доступно только студсовету.');return originalEvict(...arguments);};
const oldProfile=showProfile;showProfile=function(){oldProfile();const sh=$v('#modalSheet');if(sh){const label=sh.querySelector('.badge.blue');if(label){const c=roleClass(state.user);label.style.background=`color-mix(in srgb,var(--v2-${c},#2677db) 15%,transparent)`;label.style.color=`var(--v2-${c},#2677db)`;}if(privileged())sh.insertAdjacentHTML('beforeend','<button class="btn btn-primary btn-wide" onclick="closeModal();v2Go(\'profiles\')">Тестовые профили V2.0</button>');}};
const oldCouncil=renderCouncil;renderCouncil=async function(kind,seq){await oldCouncil(kind,seq);if(!pageAlive(kind==='council'?'council':'activists',seq))return;const node=$v('#view');if(node&&kind==='council'&&privileged())node.insertAdjacentHTML('beforeend','<button class="btn btn-secondary btn-wide" onclick="v2Go(\'roster\')">Выбрать пользователя Telegram и аватар</button>');if(node){const data=await call('appGetCouncil',kind);const users=data?.rows||[];const cards=[...node.querySelectorAll('.row-card')];cards.forEach((card,i)=>{const nm=card.querySelector('.row-main b')?.textContent?.trim();const r=users.find(x=>String(x['ФИО']||x['Имя']||'').trim()===nm);if(r&&r['Telegram']){let small=document.createElement('small');small.textContent=String(r['Telegram']).startsWith('@')?r['Telegram']:'@'+r['Telegram'];card.querySelector('.row-main')?.appendChild(small);}if(r){const role=String(r['Должность']||r['Роль']||r['Сектор']||'').toLowerCase(),pill=document.createElement('span');pill.className='v2-tag '+(state.user?.isOwner&&String(r['Telegram ID']||'')===String(state.user.id)?'owner':role.includes('председатель')?(role.includes('зам')?'vice_chair':'chair'):role.includes('глава')?(role.includes('зам')?'sector_deputy':'sector_head'):'activist');pill.textContent=r['Должность']||r['Сектор']||'Участник';card.querySelector('.row-main')?.appendChild(pill);}});}};
const oldTaskDetail=drawTaskDetail;drawTaskDetail=function(task,events){oldTaskDetail(task,events);if(allowed('delete_task')){const view=$v('#view');view?.insertAdjacentHTML('beforeend',`<button class="btn btn-secondary btn-wide" style="color:#b32839" onclick="v2DeleteTask('${escV(task.id)}')">Удалить задачу</button>`);}};
const oldSpecial=renderSpecial;renderSpecial=async function(){await oldSpecial();if(privileged()&&state.currentPage==='special')$v('#view')?.insertAdjacentHTML('beforeend',elAction('Центр V2.0','Онлайн · разработчики · роли · профили',"v2Go('admin')"));};
window.v2Go=v2Page;window.v2DeveloperChange=v2DeveloperChange;window.v2SetRoleColor=v2SetRoleColor;window.v2RosterLink=v2RosterLink;window.v2SaveProfile=v2SaveProfile;window.v2Comment=v2Comment;window.v2CheckLoad=v2CheckLoad;window.v2CheckSave=v2CheckSave;window.v2ReadDocument=v2ReadDocument;window.v2CommitImport=v2CommitImport;window.v2DeleteTask=v2DeleteTask;
function v2Refresh(){if(state.user&&!V2.ready)reloadCapabilities();else if(state.user){decorateRole();if(state.currentPage==='more')v2More();if(state.currentPage==='home'){if(!allowed('add'))document.querySelectorAll('.action-grid button[onclick*=\"openAddStudent\"]').forEach(x=>x.remove());if(!allowed('move'))document.querySelectorAll('.action-grid button[onclick*=\"openQuickMove\"]').forEach(x=>x.remove());}}}
setTimeout(v2Refresh,1000);setInterval(v2Refresh,12000);setTimeout(tick,5000);setInterval(tick,45000);document.addEventListener('visibilitychange',()=>{if(!document.hidden){tick();v2Refresh();}});
/* CAMPUS_V201_UI_HOTFIX — inside Campus V2 closure, after avatar extension. */
const V201_DEFAULT_COLORS={owner:'#D93B48',developer:'#C18B18',chair:'#26935E',vice_chair:'#26935E',sector_head:'#D39D13',sector_deputy:'#D39D13',member:'#2877D7',activist:'#2877D7'};
const V201_CACHE_KEY='campus-v2-palette-cache-v1';
let v201RosterState=null;
function v201Palette(){
  let cache={};try{const x=JSON.parse(localStorage.getItem(V201_CACHE_KEY)||'{}');if(x&&typeof x==='object')cache=x;}catch(_e){}
  return Object.assign({},V201_DEFAULT_COLORS,cache,V2.palette||{});
}
function v201Tone(key){
  const color=String(v201Palette()[key]||V201_DEFAULT_COLORS.member);
  const hex=/^#[0-9a-f]{6}$/i.test(color)?color:V201_DEFAULT_COLORS.member;
  const n=parseInt(hex.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  const brightness=.2126*r+.7152*g+.0722*b;
  const ink=brightness>211?`rgb(${Math.round(r*.62)},${Math.round(g*.62)},${Math.round(b*.62)})`:hex;
  return {ink,css:`color:${ink};background-color:rgba(${r},${g},${b},.16);border-color:rgba(${r},${g},${b},.32);`};
}
function v201DecorateRole(){
  const tag=$v('.hero-side .role-chip');
  if(tag){const t=v201Tone(roleClass(state.user));tag.style.cssText=t.css;tag.style.visibility='visible';}
  const splash=$v('#splashVersion');if(splash)splash.textContent='Версия V2.0.4 · Глобальное обновление';
}
decorateRole=v201DecorateRole;
const v201ReloadOriginal=reloadCapabilities;
reloadCapabilities=async function(){
  await v201ReloadOriginal();
  if(V2.ready&&V2.palette&&Object.keys(V2.palette).length){
    try{localStorage.setItem(V201_CACHE_KEY,JSON.stringify(V2.palette));}catch(_e){}
  }
  v201DecorateRole();
};
const v201SetColorOriginal=v2SetRoleColor;
v2SetRoleColor=async function(key,hex){
  await v201SetColorOriginal(key,hex);
  if(V2.palette&&Object.keys(V2.palette).length){try{localStorage.setItem(V201_CACHE_KEY,JSON.stringify(V2.palette));}catch(_e){}}
  v201DecorateRole();
};
window.v2SetRoleColor=v2SetRoleColor;
function v201Norm(s){return String(s||'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' ').trim();}
function v201CouncilKey(role,row){
  const id=String(row['Telegram ID']||row['TelegramID']||'').trim();
  if(state.user?.isOwner&&id&&id===String(state.user.id))return 'owner';
  if(id==='7272434463'||/разработчик/i.test(role))return 'developer';
  const t=v201Norm(role);
  if(/заместител.*председат|зам председ/.test(t))return 'vice_chair';
  if(/председател/.test(t))return 'chair';
  if(/заместител.*глав|зам глав/.test(t))return 'sector_deputy';
  if(/глава|руководител.*сектор/.test(t))return 'sector_head';
  return t.includes('активист')?'activist':'member';
}
function v201Priority(row){
  const role=v201Norm(row['Должность']||row['Роль']||row['Позиция']||'');
  if(/председател/.test(role))return /зам/.test(role)?2:1;
  if(/глав|руководител.*сектор/.test(role))return /зам/.test(role)?4:3;
  return 10;
}
function v201MemberName(row){return String(row['ФИО']||row['Имя']||row['Аты-жөні']||'Участник').trim();}
function v201PhotoUrl(url){const str=String(url||'').trim();return /^https:\/\//i.test(str)?str:'';}
function v201RosterCard(item,i,total,canOrder){
  const row=item.row,name=v201MemberName(row),role=String(row['Должность']||row['Роль']||row['Позиция']||row['Сектор']||'').trim();
  const k=v201CouncilKey(role,row),tone=v201Tone(k);
  const photo=v201PhotoUrl(item.photoUrl||row['Фото']||row.photoUrl||'');
  const nick=String(item.username||row['Telegram']||'').trim().replace(/^@/,'');
  const room=String(row['Комната']||'').trim();
  const n=`<small class="v201-order-number">№ ${i+1}</small>`;
  const controls=canOrder?`<div class="v201-order-controls"><button type="button" aria-label="Поднять ${escV(name)} выше" onclick="v201MoveRoster(${i},-1)" ${i===0?'disabled':''}>↑</button><button type="button" aria-label="Опустить ${escV(name)} ниже" onclick="v201MoveRoster(${i},1)" ${i===total-1?'disabled':''}>↓</button></div>`:'';
  return `<article class="row-card v201-row">${avatarHtml(name,photo)}<span class="row-main v201-member-main">${n}<b>${escV(name)}</b>${nick?`<small class="v201-nick">@${escV(nick)}</small>`:''}${role?`<span class="v2-tag" style="${tone.css}">${escV(role)}</span>`:''}${room?`<small>Комната ${escV(room)}</small>`:''}</span>${controls}</article>`;
}
function v201DrawRoster(){
  const context=v201RosterState,node=$v('#generic');if(!context||!node||state.currentPage!==context.kind)return;
  const canOrder=privileged()&&context.canOrder;
  node.innerHTML=context.rows.map((x,i)=>v201RosterCard(x,i,context.rows.length,canOrder)).join('')||'<div class="empty">Список пока пустой.</div>';
}
async function v201MoveRoster(index,direction){
  const ctx=v201RosterState;
  if(!ctx||!privileged()||!ctx.canOrder||ctx.saving||state.currentPage!==ctx.kind)return;
  const other=index+direction;if(other<0||other>=ctx.rows.length)return;
  ctx.saving=true;
  const changed=ctx.rows.slice();[changed[index],changed[other]]=[changed[other],changed[index]];
  const keys=changed.map(x=>x.key);
  const buttons=document.querySelectorAll('.v201-order-controls button');buttons.forEach(b=>b.disabled=true);
  try{
    const answer=await call('appV2SetRosterOrder',ctx.kind,keys);
    if(!answer?.ok)throw new Error('Сервер не подтвердил сохранение порядка.');
    ctx.rows=changed;v201DrawRoster();notice('Порядок сохранён для всех пользователей');
  }catch(e){notice('Не удалось сохранить порядок: '+(e?.message||e));v201DrawRoster();}
  finally{ctx.saving=false;}
}
window.v201MoveRoster=v201MoveRoster;
renderCouncil=async function(kind,seq){
  kind=kind==='activists'?'activists':'council';
  const title=kind==='activists'?'Активисты':'Студенческий совет';
  $v('#view').innerHTML=pageHead(title,'more')+'<div id="generic" class="list">'+studentSkeletons()+'</div>';
  const entries=await Promise.allSettled([
    apiRequest('appGetCouncil',[state.initData,kind],{ttl:25000}),
    call('appV2GetRosterOrder',kind),
    call('appV2AvatarDirectory',kind)
  ]);
  if(!pageAlive(kind,seq))return;
  if(entries[0].status!=='fulfilled'){$v('#generic').innerHTML=`<div class="empty">${safeErr(entries[0].reason)}</div>`;return;}
  const rows=Array.isArray(entries[0].value?.rows)?entries[0].value.rows:[];
  const order=entries[1].status==='fulfilled'?entries[1].value:null;
  const avatars=entries[2].status==='fulfilled'?entries[2].value?.rows:[];
  const canOrder=!!(order&&Array.isArray(order.items)&&order.items.length===rows.length&&order.items.every((x,i)=>v201Norm(x.name)===v201Norm(v201MemberName(rows[i]))));
  const cnt=new Map();
  (Array.isArray(avatars)?avatars:[]).forEach(a=>{const k=v201Norm(a.name);cnt.set(k,(cnt.get(k)||0)+1);});
  const byName=new Map((Array.isArray(avatars)?avatars:[]).filter(a=>cnt.get(v201Norm(a.name))===1).map(a=>[v201Norm(a.name),a]));
  const list=rows.map((row,i)=>{
    const extra=byName.get(v201Norm(v201MemberName(row)))||{};
    return {row,key:canOrder?order.items[i].key:'',photoUrl:extra.photoUrl||'',username:extra.username||''};
  });
  if(order?.saved&&canOrder){
    const ranks=new Map(order.order.map((k,i)=>[k,i]));
    list.sort((a,b)=>(ranks.get(a.key)??1e6)-(ranks.get(b.key)??1e6));
  }else if(kind==='council'){
    list.sort((a,b)=>v201Priority(a.row)-v201Priority(b.row)||v201MemberName(a.row).localeCompare(v201MemberName(b.row),'ru'));
  }
  v201RosterState={kind,rows:list,canOrder,saving:false};
  if(!canOrder&&privileged())$v('#view').insertAdjacentHTML('beforeend','<p class="v201-order-notice">Для сохранения порядка установите серверное дополнение V2.0.1.</p>');
  if(privileged())$v('#view').insertAdjacentHTML('beforeend',`<button class="btn btn-secondary btn-wide" onclick="v2Go('${kind==='council'?'roster':'activist-roster'}')">Выбрать Telegram-пользователя и аватар</button>`);
  v201DrawRoster();
};
function v201DetectCountry(s){
  const v=v201Norm(s);
  if(!v||/казахстан|қазақстан|kazakhstan|\bрк\b/.test(v))return '';
  const countries=[
    ['Туркменистан',/туркмен|түрікмен|turkmen|ашхабад|ashgabat/],
    ['Монголия',/монгол|моңғол|монғол|mongol|улан.?батор|ulaanbaatar/],
    ['Нигерия',/нигерия|nigeria/],
    ['Египет',/египет|egypt/],
    ['Китай',/китай|қытай|china|пекин|beijing/],
    ['Индонезия',/индонез|indones/],
    ['Афганистан',/афган|afghan/],
    ['Пакистан',/пакистан|pakistan/],
    ['Узбекистан',/узбек|өзбек|uzbek/],
    ['Бангладеш',/бангладеш|bangladesh/],
    ['Танзания',/танзания|tanzania/],
    ['Сомали',/сомали|somalia/],
    ['Россия',/росси|россия|russia/],
    ['Кыргызстан',/кыргыз|киргиз|kyrgyz/],
    ['Таджикистан',/таджик|tajik/],
    ['Индия',/индия|india/],
    ['Турция',/турция|türkiye|turkey|türkiye/],
    ['Иран',/иран|iran/]
  ];
  return countries.find(([_,re])=>re.test(v))?.[0]||'';
}
function v201ForeignersFromStudents(){
  const arr=state.studentLists?.active;
  if(!Array.isArray(arr))return null;
  return arr.filter(s=>s&&s.active!==false&&v201DetectCountry(s.registration)).map(s=>({...s,country:v201DetectCountry(s.registration)}));
}
const v201RenderForeignOriginal=renderGenericTable;
renderGenericTable=async function(title,fn,back,seq){
  if(fn!=='appGetForeigners')return v201RenderForeignOriginal(title,fn,back,seq);
  const local=v201ForeignersFromStudents();
  const remote=await apiRequest('appGetForeigners',[state.initData],{ttl:15000}).catch(()=>null);
  if(!pageAlive('foreigners',seq))return;
  if(Array.isArray(remote?.rows)&&remote.rows.length)return v201RenderForeignOriginal(title,fn,back,seq);
  if(!local||!local.length)return v201RenderForeignOriginal(title,fn,back,seq);
  $v('#view').innerHTML=`${pageHead('Иностранные студенты','more')}<div class="v2-panel"><b>По прописке: ${local.length} студентов</b><p class="v2-note">Автоматическая выборка из актуальных заселённых студентов. Не является подтверждением гражданства.</p></div><div class="list">${local.map(s=>`<div class="row-card">${avatarHtml(s.fio,'')}<span class="row-main"><b>${escV(s.fio)}</b><small>${escV(s.country)} · комната ${escV(s.room||'—')}</small>${s.faculty?`<small>${escV(s.faculty)}</small>`:''}</span></div>`).join('')}</div>`;
};
const v201HomeOriginal=renderHome;
renderHome=function(){
  const local=v201ForeignersFromStudents();
  if(local&&state.dashboard)state.dashboard.foreigners=local.length;
  v201HomeOriginal();
  v201DecorateRole();
};


/* CAMPUS_V203_HOME_CHOICES — Personal dashboard: four overview cards and two quick actions.
 * No backend writes. Never stores students, passport numbers or PII.
 * This code runs INSIDE the existing Campus V2 addon closure, AFTER V2.0.2.
 */
const V203_OVERVIEW=[
  {id:'residents',label:'Заселено сейчас',icon:'users',page:'students',tone:'green'},
  {id:'free',label:'Свободно комнат',icon:'door',page:'rooms'},
  {id:'foreign',label:'Иностранные',icon:'globe',page:'foreigners'},
  {id:'council',label:'Студсовет и активисты',icon:'council',page:'council'},
  {id:'occupied',label:'Занято комнат',icon:'grid',page:'rooms'},
  {id:'totalrooms',label:'Всего комнат',icon:'grid',page:'rooms'},
  {id:'block1',label:'1 блок · проживающие',icon:'users',page:'analytics'},
  {id:'block2',label:'2 блок · проживающие',icon:'users',page:'analytics'},
  {id:'block3',label:'3 блок · проживающие',icon:'users',page:'analytics'},
  {id:'college',label:'Колледж',icon:'users',page:'analytics'},
  {id:'foundation',label:'Foundation',icon:'users',page:'analytics'},
  {id:'turkmen',label:'Туркмения',icon:'globe',page:'analytics'},
  {id:'mongolian',label:'Монголия',icon:'globe',page:'analytics'}
];
const V203_ACTIONS=[
  {id:'find',label:'Найти студента',description:'ФИО, ИИН или комната',icon:'search'},
  {id:'analytics',label:'Аналитика',description:'Динамика заселения',icon:'chart'},
  {id:'rooms',label:'Комнаты',description:'Заселённость по комнатам',icon:'grid'},
  {id:'tasks',label:'Задачи',description:'Поручения и сроки',icon:'clipboard'},
  {id:'documents',label:'Документы',description:'Шаблоны и черновики',icon:'book'},
  {id:'foreigners',label:'Иностранцы',description:'Список по прописке',icon:'globe'},
  {id:'council',label:'Студсовет',description:'Участники и должности',icon:'council'},
  {id:'activists',label:'Активисты',description:'Участники по секторам',icon:'users'},
  {id:'add',label:'Заселить',description:'Добавить студента',icon:'plus',right:'add'},
  {id:'move',label:'Переселить',description:'Изменить комнату',icon:'swap',right:'move'},
  {id:'inspections',label:'Проверка комнат',description:'Чистый вторник и четверг',icon:'clipboard',right:'inspection'}
];
const V203_DEFAULTS={overview:['residents','free','foreign','council'],actions:['find','analytics']};
function v203Limit(kind){return kind==='overview'?4:2;}
let v203Draft=null;
function v203UserKey(kind){
  const id=String(state.user?.id||'');
  return id?'campus-home-v203-'+id+'-'+kind:'';
}
function v203ActionsAvailable(){
  return V203_ACTIONS.filter(item=>!item.right||(V2.ready&&allowed(item.right)));
}
function v203Options(kind){return kind==='overview'?V203_OVERVIEW:v203ActionsAvailable();}
function v203ReadSaved(kind){
  const key=v203UserKey(kind);if(!key)return null;
  try{const arr=JSON.parse(localStorage.getItem(key)||'null');return Array.isArray(arr)?arr:null;}catch(_e){return null;}
}
function v203Choice(kind){
  const options=v203Options(kind),valid=new Set(options.map(x=>x.id));
  const saved=v203ReadSaved(kind),candidates=(Array.isArray(saved)?saved:V203_DEFAULTS[kind]).filter((x,i,a)=>valid.has(x)&&a.indexOf(x)===i);
  for(const id of [...V203_DEFAULTS[kind],...options.map(o=>o.id)]){
    if(candidates.length===v203Limit(kind))break;
    if(valid.has(id)&&!candidates.includes(id))candidates.push(id);
  }
  return candidates.slice(0,v203Limit(kind));
}
function v203BlockNumber(value){
  const n=Number(String(value??'').trim());
  if(!Number.isInteger(n))return 0;
  if([13,14,23].includes(n)||(n>=30&&n<=73))return 1;
  if(n>=74&&n<=117)return 2;
  if((n>=119&&n<=125)||(n>=128&&n<=162))return 3;
  return 0;
}
function v203CountData(){
  const d=state.dashboard||{};
  const hasList=Array.isArray(state.studentLists?.active);
  const rows=hasList?state.studentLists.active.filter(s=>s&&s.active!==false):[];
  const unknown='—';
  const val=(key)=>d[key]===null||d[key]===undefined?unknown:(Number.isFinite(Number(d[key]))?Number(d[key]):unknown);
  const count=(fn)=>hasList?rows.filter(fn).length:unknown;
  const foreigners=count(s=>!!v201DetectCountry(s.registration));
  const council=Number(d.council||0)+Number(d.activists||0);
  return {
    residents:val('currentStudents')!==unknown?val('currentStudents'):(hasList?rows.length:unknown),
    free:val('freeRooms'),foreign:foreigners!==unknown?foreigners:(Number(d.foreigners)>0?Number(d.foreigners):unknown),
    council:(val('council')===unknown&&val('activists')===unknown)?unknown:council,
    occupied:val('occupiedRooms'),totalrooms:val('totalRooms'),
    block1:count(s=>v203BlockNumber(s.room)===1),
    block2:count(s=>v203BlockNumber(s.room)===2),
    block3:count(s=>v203BlockNumber(s.room)===3),
    college:count(s=>/колледж|college/i.test(String(s.faculty||''))),
    foundation:count(s=>/foundation|фоунд|фаунд/i.test(String(s.faculty||''))),
    turkmen:count(s=>v201DetectCountry(s.registration)==='Туркменистан'),
    mongolian:count(s=>v201DetectCountry(s.registration)==='Монголия')
  };
}
function v203AddSettingsButton(text,kind){
  const heading=[...document.querySelectorAll('#view .section-heading')]
    .find(el=>el.querySelector('h2')?.textContent.trim()===text);
  if(!heading||heading.querySelector('.v203-config-button'))return;
  let tools=heading.querySelector('.v203-heading-tools');
  if(!tools){
    tools=document.createElement('div');tools.className='v203-heading-tools';
    const old=[...heading.children].find(el=>el.tagName==='BUTTON');
    if(old)tools.appendChild(old);
    heading.appendChild(tools);
  }
  const btn=document.createElement('button');
  btn.type='button';btn.className='v203-config-button';
  btn.textContent='⚙ Настроить';btn.setAttribute('aria-label','Настроить '+text.toLowerCase());
  btn.setAttribute('onclick',"v203OpenSettings('"+kind+"')");
  tools.appendChild(btn);
}
function v203ApplyHome(){
  if(state.currentPage!=='home')return;
  const overview=document.querySelector('#view .stats-grid');
  const actions=document.querySelector('#view .action-grid');
  if(!overview||!actions)return;
  const values=v203CountData();
  overview.innerHTML=v203Choice('overview').map(id=>{
    const item=V203_OVERVIEW.find(x=>x.id===id);
    return item?statCard(item.icon,values[id],item.label,item.tone||'',item.page):'';
  }).join('');
  actions.innerHTML=v203Choice('actions').map(id=>{
    const item=V203_ACTIONS.find(x=>x.id===id);
    return item?actionCard(item.icon,item.label,item.description,"v203RunAction('"+item.id+"')") : '';
  }).join('');
  v203AddSettingsButton('Обзор','overview');
  v203AddSettingsButton('Быстрые действия','actions');
}
function v203RunAction(id){
  const item=V203_ACTIONS.find(x=>x.id===id);
  if(!item)return;
  if(item.right&&(!V2.ready||!allowed(item.right))){
    toast('Недостаточно прав для этого действия');v203ApplyHome();return;
  }
  switch(id){
    case 'find':return render('students');
    case 'analytics':return render('analytics');
    case 'rooms':return render('rooms');
    case 'tasks':return render('tasks');
    case 'documents':return render('documents');
    case 'foreigners':return render('foreigners');
    case 'council':return render('council');
    case 'activists':return render('activists');
    case 'add':return openAddStudent();
    case 'move':return openQuickMove();
    case 'inspections':return v2Go('inspections');
  }
}
function v203PickerHtml(){
  if(!v203Draft)return '';
  const {kind,values}=v203Draft;
  return v203Options(kind).map(item=>{
    const selected=values.includes(item.id);
    return `<button class="v203-choice" type="button" aria-pressed="${selected?'true':'false'}" onclick="v203ToggleChoice('${kind}','${item.id}')"><span class="v203-choice-text"><b>${escV(item.label)}</b>${item.description?`<small>${escV(item.description)}</small>`:''}</span><span class="v203-check">${selected?'✓':'+'}</span></button>`;
  }).join('');
}
function v203UpdatePicker(){
  if(!v203Draft)return;
  const list=document.querySelector('#v203-choices');if(list)list.innerHTML=v203PickerHtml();
  const limit=v203Limit(v203Draft.kind);
  const count=document.querySelector('#v203-count');if(count)count.textContent='Выбрано '+v203Draft.values.length+' из '+limit;
  const save=document.querySelector('#v203-save');if(save)save.disabled=v203Draft.values.length!==limit;
}
function v203OpenSettings(kind){
  if(!['overview','actions'].includes(kind)||!state.user?.id)return;
  v203Draft={kind,values:v203Choice(kind).slice()};
  const limit=v203Limit(kind);
  showModal(`<div class="sheet-handle"></div><div class="v203-modal-header"><h3>${kind==='overview'?'Карточки обзора':'Быстрые действия'}</h3><p>Выберите ровно ${kind==='overview'?'четыре':'две'} карточки для своей главной страницы. У каждого пользователя выбор свой.</p><small id="v203-count">Выбрано ${v203Draft.values.length} из ${limit}</small></div><div id="v203-choices" class="v203-choices">${v203PickerHtml()}</div><button class="btn btn-primary btn-wide" id="v203-save" onclick="v203SaveSettings()">Сохранить</button><button class="btn btn-secondary btn-wide" onclick="v203Draft=null;closeModal()">Отмена</button>`);
}
function v203ToggleChoice(kind,id){
  if(!v203Draft||v203Draft.kind!==kind)return;
  if(!v203Options(kind).some(x=>x.id===id))return;
  const values=v203Draft.values;
  if(values.includes(id))values.splice(values.indexOf(id),1);
  else if(values.length>=v203Limit(kind)){toast(kind==='overview'?'В обзоре можно выбрать только четыре карточки. Сначала снимите одну.':'В быстрых действиях можно выбрать только две карточки. Сначала снимите одну.');return;}
  else values.push(id);
  v203UpdatePicker();
}
function v203SaveSettings(){
  const draft=v203Draft;if(!draft||draft.values.length!==v203Limit(draft.kind)||new Set(draft.values).size!==v203Limit(draft.kind))return;
  const valid=new Set(v203Options(draft.kind).map(x=>x.id));
  if(!draft.values.every(id=>valid.has(id)))return toast('Один из вариантов сейчас недоступен');
  const key=v203UserKey(draft.kind);if(!key)return;
  try{localStorage.setItem(key,JSON.stringify(draft.values));}
  catch(_e){toast('Не удалось сохранить настройки на этом устройстве');return;}
  v203Draft=null;closeModal();v203ApplyHome();toast(draft.kind==='overview'?'Обзор: сохранены четыре карточки':'Быстрые действия: сохранены две кнопки');
}
window.v203RunAction=v203RunAction;
window.v203OpenSettings=v203OpenSettings;
window.v203ToggleChoice=v203ToggleChoice;
window.v203SaveSettings=v203SaveSettings;
const v203OldRenderHome=renderHome;
renderHome=function(){
  v203OldRenderHome.apply(this,arguments);
  v203ApplyHome();
};
const v203OldReload=reloadCapabilities;
reloadCapabilities=async function(){
  const result=await v203OldReload.apply(this,arguments);
  if(state.currentPage==='home')v203ApplyHome();
  return result;
};
setTimeout(()=>{if(state.currentPage==='home')v203ApplyHome();},1600);


/* CAMPUS_V204_INSPECTIONS — verified floor grouping and persistent Tuesday/Thursday marks.
 * Loads and saves only through authenticated Apps Script V204 routes.
 * Adds no new authorization or student-data access on the frontend.
 */
const V204={request:0,busy:false,selected:null,floorBlock:1};
function v204FmtLocal(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function v204DateFor(day,fromDate){
  const base=fromDate?new Date(String(fromDate)+'T12:00:00'):new Date();
  if(Number.isNaN(+base))return v204FmtLocal(new Date());
  const offset=(Number(day)-base.getDay()+7)%7;
  // nearest eligible day: allow Tuesday tomorrow on Monday, last Thursday on Friday
  base.setDate(base.getDate()+(offset>3?offset-7:offset));
  return v204FmtLocal(base);
}
function v204Weekday(iso){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(iso||'')))return 0;
  const d=new Date(String(iso)+'T12:00:00');
  return Number.isNaN(+d)?0:d.getDay();
}
function v204Selection(){
  return {date:$v('#v204-check-date')?.value||'',day:Number($v('#v204-check-day')?.value||2),block:Number($v('#v204-check-block')?.value||1),band:$v('#v204-check-band')?.value||'2–3'};
}
function v204Dirty(){return [...document.querySelectorAll('#v204-check-rooms .v204-room[data-dirty="1"]')];}
function v204DirtyNotice(){
  const n=v204Dirty().length,b=$v('#v204-check-save'),status=$v('#v204-dirty-count');
  if(b){b.disabled=!n||V204.busy;b.textContent=V204.busy?'Сохраняем…':`Сохранить изменения${n?' ('+n+')':''}`;}
  if(status)status.textContent=n?`${n} ${n===1?'комната изменена':'комнат изменено'}. После сохранения оценки останутся в Google Таблице.`:'Измените оценку или замечание в комнате, затем нажмите «Сохранить изменения».';
}
function v204MarkDirty(node){
  const room=node?.closest('.v204-room');
  if(room){room.dataset.dirty='1';room.classList.add('v204-dirty');v204DirtyNotice();}
}
function v204SetStatus(value,error=false){
  const el=$v('#v204-check-status');
  if(el){el.textContent=value;el.classList.toggle('v204-error',!!error);}
}
function v204ConfirmDiscard(){
  return !v204Dirty().length||confirm('Есть несохранённые оценки. Перейти без сохранения?');
}
function v204SelectDay(){
  if(!v204ConfirmDiscard()){
    if(V204.selected){$v('#v204-check-day').value=String(V204.selected.day);}return;
  }
  const day=$v('#v204-check-day').value,date=$v('#v204-check-date');
  if(date)date.value=v204DateFor(day,date.value);
  v2CheckLoad();
}
function v204ChangeSelection(){
  if(!v204ConfirmDiscard()){
    if(V204.selected){
      $v('#v204-check-date').value=V204.selected.date;
      $v('#v204-check-day').value=String(V204.selected.day);
      $v('#v204-check-block').value=String(V204.selected.block);
      $v('#v204-check-band').value=V204.selected.band;
    }
    return;
  }
  v2CheckLoad();
}
function v204RoomMarkup(item){
  const score=item.rating===null||item.rating===undefined?'':String(item.rating);
  const options=[5,4,3,2,1].map(v=>`<option value="${v}" ${score===String(v)?'selected':''}>${v} / 5</option>`).join('');
  const saved=item.saved?'<span class="v204-saved-mark">Есть запись</span>':'';
  const legacy=item.legacy?'<small class="v204-legacy">Прежняя группа этажей — при сохранении обновится</small>':'';
  return `<article class="v2-room v204-room" data-room="${Number(item.room)}" data-dirty="0">
    <div class="v204-room-head"><b>Комната ${Number(item.room)}</b><span>${Number(item.floor)} этаж</span></div>
    ${saved}
    <select class="v2-score v204-score" aria-label="Оценка комнаты ${Number(item.room)}" onchange="v204MarkDirty(this)">
      <option value="" ${!score?'selected':''}>Не проверена</option>${options}
    </select>
    <textarea class="v2-room-note v204-room-note" maxlength="350" rows="2" placeholder="Замечание" oninput="v204MarkDirty(this)">${escV(item.note||'')}</textarea>
    ${legacy}
  </article>`;
}
function v204ShowValidDate(){
  const {day,date}=v204Selection();
  if(!date||v204Weekday(date)!==day){
    v204SetStatus(`Выберите дату, которая приходится на ${day===2?'вторник':'четверг'}.`,true);
    $v('#v204-check-rooms').innerHTML='<div class="v2-note">Дата и выбранный день должны совпадать.</div>';
    return false;
  }
  return true;
}
// Replace the pre-existing V2 inspection screen, leaving the rest of V2 unmodified.
v2Inspect=function(){
  if(!allowed('inspection'))return notice('Доступ к проверкам закрыт');
  V204.request++;V204.busy=false;V204.selected=null;
  const now=new Date(),firstDay=now.getDay()===4?4:2;
  show(`${heading('Проверка комнат','more')}
    <section class="v2-panel v204-inspection-controls">
      <p class="v2-note">Выберите день проверки, блок и этажи. Оценки сохраняются отдельно для каждой даты и комнаты.</p>
      <label for="v204-check-day">Проверка за</label>
      <select class="v2-select" id="v204-check-day" onchange="v204SelectDay()">
        <option value="2" ${firstDay===2?'selected':''}>Вторник</option>
        <option value="4" ${firstDay===4?'selected':''}>Четверг</option>
      </select>
      <label for="v204-check-date">Дата проверки</label>
      <input type="date" class="v2-input" id="v204-check-date" value="${v204DateFor(firstDay)}" onchange="v204ChangeSelection()">
      <label for="v204-check-block">Блок</label>
      <select class="v2-select" id="v204-check-block" onchange="v204ChangeSelection()">
        <option value="1">1 блок</option><option value="2">2 блок</option><option value="3">3 блок</option>
      </select>
      <label for="v204-check-band">Этажи</label>
      <select class="v2-select" id="v204-check-band" onchange="v204ChangeSelection()">
        <option value="2–3">2–3 этажи</option><option value="4–5">4–5 этажи</option>
      </select>
      <small class="v2-note">Во 1-м блоке комнаты 30–40 относятся ко 2-му этажу. Комнат 126 и 127 в проверках нет.</small>
      ${privileged()?'<button class="btn btn-secondary v204-floor-settings" type="button" onclick="v204OpenFloorMap()">⚙ Настроить расположение комнат по этажам</button>':''}
    </section>
    <section class="v2-panel">
      <h3>Оценки комнат</h3>
      <div class="v2-note" id="v204-check-status" role="status" aria-live="polite">Загружаем предыдущие оценки…</div>
      <div id="v204-check-rooms" class="v2-rooms v204-room-grid"></div>
      <div class="v2-note" id="v204-dirty-count"></div>
      <button id="v204-check-save" class="btn btn-primary btn-wide" type="button" onclick="v2CheckSave()" disabled>Сохранить изменения</button>
    </section>`);
  v2CheckLoad();
};
v2CheckLoad=async function(){
  const roomEl=$v('#v204-check-rooms');if(!roomEl)return;
  const info=v204Selection();
  const ticket=++V204.request;
  if(!v204ShowValidDate())return;
  V204.busy=true;V204.selected={...info};
  roomEl.innerHTML='<div class="v2-note">Загрузка комнат и сохранённых оценок…</div>';
  v204SetStatus('Загружаем…');v204DirtyNotice();
  try{
    const data=await call('appV204GetInspections',info.date,info.block,info.band,info.day);
    if(ticket!==V204.request||!$v('#v204-check-rooms'))return;
    if(!Array.isArray(data?.rooms))throw new Error('Сервер вернул некорректный список комнат.');
    // Defense in depth, absent rooms are never rendered.
    const rooms=data.rooms.filter(r=>Number(r.room)!==126&&Number(r.room)!==127);
    V2.inspections=rooms;
    roomEl.innerHTML=rooms.length?rooms.map(v204RoomMarkup).join(''):'<div class="v2-note">В выбранной группе нет комнат.</div>';
    const floorCounts={2:0,3:0,4:0,5:0};rooms.forEach(x=>{if(x.floor in floorCounts)floorCounts[x.floor]++;});
    const parts=(info.band==='2–3'?[2,3]:[4,5]).map(f=>`${f}-й этаж: ${floorCounts[f]||0}`).join(' · ');
    v204SetStatus(`Комнат: ${rooms.length} · сохранённых оценок: ${Number(data.saved)||0} · ${parts}.`);
  }catch(e){
    if(ticket!==V204.request||!$v('#v204-check-rooms'))return;
    roomEl.innerHTML='<div class="v2-note v204-error">Не удалось получить оценки. Проверьте развёртывание серверного модуля V2.0.4.</div>';
    v204SetStatus(String(e?.message||e),true);
  }finally{
    if(ticket===V204.request){V204.busy=false;v204DirtyNotice();}
  }
};
v2CheckSave=async function(){
  if(V204.busy)return;
  const info=v204Selection();
  if(!v204ShowValidDate())return;
  if(!V204.selected||Object.keys(info).some(k=>String(info[k])!==String(V204.selected[k])))return notice('Параметры проверки изменились. Повторно загрузите комнаты.');
  const dirty=v204Dirty();
  if(!dirty.length)return notice('Нет изменений для сохранения.');
  const items=dirty.map(card=>({
    room:Number(card.dataset.room),
    rating:card.querySelector('.v204-score')?.value||'',
    note:card.querySelector('.v204-room-note')?.value||''
  }));
  if(!confirm(`Сохранить изменения для ${items.length} комнат?\n${info.date} · ${info.block} блок · этажи ${info.band}`))return;
  V204.busy=true;v204DirtyNotice();
  try{
    const result=await call('appV204SaveInspections',{...info,items});
    notice(`Сохранено: ${Number(result.saved)||0} комнат.`);
    V204.busy=false;
    await v2CheckLoad();
  }catch(e){
    V204.busy=false;v204DirtyNotice();
    v204SetStatus('Ошибка сохранения: '+String(e?.message||e),true);
    notice(String(e?.message||e));
  }
};
async function v204OpenFloorMap(){
  if(!privileged())return notice('Настройка этажей доступна только владельцу и разработчику.');
  if(!v204ConfirmDiscard())return;
  V204.floorBlock=Number($v('#v204-check-block')?.value||1);
  showModal(`<div class="sheet-handle"></div><h3>Этажи и комнаты</h3>
    <p class="v2-note">Менять расположение комнат вправе только владелец и разработчик. После сохранения фильтрация обновится для всех.</p>
    <label for="v204-floor-block">Блок</label>
    <select id="v204-floor-block" class="v2-select" onchange="v204LoadFloorMap()">
      <option value="1" ${V204.floorBlock===1?'selected':''}>1 блок</option>
      <option value="2" ${V204.floorBlock===2?'selected':''}>2 блок</option>
      <option value="3" ${V204.floorBlock===3?'selected':''}>3 блок</option>
    </select>
    <div id="v204-floor-rows" class="v204-floor-list"><div class="v2-note">Загрузка…</div></div>
    <button type="button" id="v204-floor-save" class="btn btn-primary btn-wide" onclick="v204SaveFloorMap()">Сохранить этажи</button>
    <button type="button" class="btn btn-secondary btn-wide" onclick="closeModal();v2CheckLoad()">Закрыть</button>`);
  await v204LoadFloorMap();
}
async function v204LoadFloorMap(){
  const el=$v('#v204-floor-rows');if(!el)return;
  const block=Number($v('#v204-floor-block')?.value||1),ticket=++V204.request;
  V204.floorBlock=block;el.innerHTML='<div class="v2-note">Получаем настройки этажей…</div>';
  try{
    const data=await call('appV204FloorMap',block);
    if(ticket!==V204.request||!el.isConnected)return;
    el.innerHTML=(data.rooms||[]).map(r=>`<label class="v204-floor-item"><span>Комната ${Number(r.room)}</span>
      <select class="v2-select v204-room-floor" data-room="${Number(r.room)}" aria-label="Этаж комнаты ${Number(r.room)}">
      ${[1,2,3,4,5].map(f=>`<option value="${f}" ${Number(r.floor)===f?'selected':''}>${f} этаж</option>`).join('')}</select></label>`).join('');
    if(!data.rooms?.length)el.innerHTML='<div class="v2-note">Комнаты не найдены.</div>';
  }catch(e){if(el.isConnected)el.textContent=String(e?.message||e);}
}
async function v204SaveFloorMap(){
  if(!privileged())return notice('Недостаточно прав.');
  const block=Number($v('#v204-floor-block')?.value||1);
  const changes=[...document.querySelectorAll('#v204-floor-rows .v204-room-floor')].map(x=>({room:Number(x.dataset.room),floor:Number(x.value)}));
  if(!changes.length)return notice('Сначала загрузите комнаты.');
  if(!confirm(`Обновить расположение ${changes.length} комнат ${block}-го блока? Это изменит их группировку при проверках для всех пользователей.`))return;
  const btn=$v('#v204-floor-save');if(btn)btn.disabled=true;
  try{
    await call('appV204SetFloorMap',block,changes);
    notice('Этажи сохранены.');closeModal();
    const chosen=$v('#v204-check-block');if(chosen)chosen.value=String(block);
    v2CheckLoad();
  }catch(e){notice(String(e?.message||e));if(btn)btn.disabled=false;}
}


})();
