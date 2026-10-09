/* CAMPUS_MANAGEMENT_V13_10 */
let maintenanceTimer=null, maintenanceBusy=false, maintenanceBlocked=false;
function maintenanceOverlay(status){
  maintenanceBlocked=true;
  state.renderSeq++;
  invalidateData(); closeModal();
  let layer=$('#maintenanceOverlay');
  if(!layer){layer=document.createElement('section');layer.id='maintenanceOverlay';layer.className='maintenance-overlay';layer.setAttribute('role','status');document.body.append(layer);}
  layer.innerHTML=`<div class="maintenance-card"><div class="maintenance-symbol">🛠</div><h1>Технические работы</h1><p>${esc(status.message||'Происходят технические работы. Пожалуйста, подождите.')}</p><small>Приложение откроется автоматически после завершения работ.</small><button class="btn btn-secondary btn-wide" onclick="pollMaintenance()">Проверить сейчас</button><small id="maintenanceCheck">Проверяем состояние автоматически…</small></div>`;
  $('#bottomNav').classList.add('hidden');
}
function clearMaintenanceOverlay(){
  maintenanceBlocked=false;$('#maintenanceOverlay')?.remove();
}
function scheduleMaintenancePoll(){
  clearTimeout(maintenanceTimer);
  maintenanceTimer=setTimeout(pollMaintenance,15000);
}
async function pollMaintenance(){
  if(maintenanceBusy || !state.initData)return;
  maintenanceBusy=true;
  try {
    const result=await apiRequest('appGetMaintenanceStatus',[state.initData],{ttl:0,force:true});
    if(result.blocked){maintenanceOverlay(result);}
    else if(maintenanceBlocked){
      // Keep the cover until fresh bootstrap data has loaded successfully.
      maintenanceBlocked=false; invalidateData();
      const opened=await boot();
      if(!opened){maintenanceBlocked=true;}
    } else {
      if(state.user && result.user){state.user=result.user;syncSpecialButton();}
    }
  } catch(e) {
    if($('#maintenanceCheck'))$('#maintenanceCheck').textContent='Не удалось проверить: '+String(e.message||e);
  } finally {maintenanceBusy=false;scheduleMaintenancePoll();}
}
function beginMaintenancePolling(){
  scheduleMaintenancePoll();
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden && state.initData)pollMaintenance();});

async function renderMaintenanceSettings(){
  if(!specialAuthorized())return renderSpecial();
  $('#view').innerHTML=pageHead('Технические работы','special')+'<div class="task-center-loading">Проверяем состояние…</div>';
  try {
    const status=await apiRequest('appGetMaintenanceStatus',[state.initData],{ttl:0,force:true});
    $('#view').innerHTML=pageHead('Технические работы','special')+`<div class="panel"><div class="task-diagnostic"><b>Состояние</b><span class="badge">${status.enabled?'Работы включены':'Приложение открыто'}</span></div><p>Все остальные пользователи, включая администрацию, увидят экран технических работ. Доступ останется у владельца и разработчика.</p><div class="field"><label for="maintenanceMessage">Сообщение пользователям</label><textarea id="maintenanceMessage" maxlength="500">${esc(status.message)}</textarea></div><button id="maintenanceToggle" class="btn ${status.enabled?'btn-primary':'btn-danger'} btn-wide" onclick="saveMaintenance(${!status.enabled})">${status.enabled?'Выключить технические работы':'Включить технические работы'}</button><div class="task-note">Режим остаётся включённым до вашего ручного выключения. После выключения приложение у остальных восстановится автоматически.</div></div>`;
  }catch(e){toast(e.message);renderSpecial();}
}
async function saveMaintenance(enabled){
  const btn=$('#maintenanceToggle');if(btn)btn.disabled=true;
  try {
    await apiRequest('appSetMaintenance',[state.initData,enabled,$('#maintenanceMessage').value],{ttl:0,force:true});
    toast(enabled?'Технические работы включены':'Приложение открыто для всех');
    await renderMaintenanceSettings();
  }catch(e){toast(e.message);if(btn)btn.disabled=false;}
}
let councilRolesData=null;
async function renderCouncilRoles(back='more'){
  if(!state.user?.canAssignRoles)return toast('Недостаточно прав для выдачи ролей');
  $('#view').innerHTML=pageHead('Роли и секторы',back)+'<div class="task-center-loading">Загружаем участников…</div>';
  try {
    councilRolesData=await apiRequest('appGetCouncilRoles',[state.initData],{ttl:0,force:true});
    $('#view').innerHTML=pageHead('Роли и секторы',back)+`<div class="task-note">Должность в студсовете учитывается отдельно от прав доступа. Назначение главы или председателя сохраняет текущий доступ пользователя.</div><div class="task-list">${councilRolesData.users.map(u=>`<button class="task-person role-person" onclick="editCouncilRole('${esc(u.id)}')"><span class="avatar">${esc(initials(u.name))}</span><span><b>${esc(u.name)}</b><small>${esc(u.role)}<br>${esc(u.accessRole)} · ${esc(u.id)}</small></span><span class="role-edit">Изменить</span></button>`).join('')}</div>`;
  }catch(e){toast(e.message);}
}
function editCouncilRole(id){
  const u=councilRolesData?.users.find(x=>x.id===id);if(!u)return;
  showModal(`<div class="sheet-handle"></div><h3>${esc(u.name)}</h3><div class="task-note">${esc(u.accessRole)} · ${esc(u.id)}</div><div class="field"><label for="councilRole">Должность</label><select id="councilRole" onchange="syncCouncilSector()">${councilRolesData.roles.map(r=>`<option value="${esc(r.id)}" ${u.position.roleId===r.id?'selected':''}>${esc(r.label)}</option>`).join('')}</select></div><div class="field" id="councilSectorField"><label for="councilSector">Сектор</label><select id="councilSector"><option value="">Без сектора</option>${councilRolesData.sectors.map(s=>`<option value="${esc(s)}" ${u.position.sector===s?'selected':''}>${esc(s==='САН'?'САН — Санитарный сектор':s)}</option>`).join('')}</select></div><button id="saveCouncilRole" class="btn btn-primary btn-wide" onclick="saveCouncilRole('${esc(id)}')">Сохранить роль</button><button class="btn btn-secondary btn-wide" onclick="closeModal()">Отмена</button>`);
  syncCouncilSector();
}
function syncCouncilSector(){
  const role=$('#councilRole').value;
  const required=role==='sector_head'||role==='sector_deputy';
  const disabled=role==='chair'||role==='vice_chair';
  $('#councilSectorField').classList.toggle('hidden',disabled);
  $('#councilSector').required=required;
  if(disabled)$('#councilSector').value='';
}
async function saveCouncilRole(id){
  const role=$('#councilRole').value,sector=$('#councilSector').value;
  if((role==='sector_head'||role==='sector_deputy')&&!sector)return toast('Выберите сектор');
  const btn=$('#saveCouncilRole');btn.disabled=true;
  try {
    const result=await apiRequest('appSetCouncilRole',[state.initData,id,role,sector],{ttl:0,force:true});
    if(String(state.user.id)===id){state.user.role=result.role;state.user.position=result.position;}
    closeModal();toast('Роль сохранена');await renderCouncilRoles(state.currentPage==='special-users'?'special':'more');
  }catch(e){toast(e.message);btn.disabled=false;}
}
