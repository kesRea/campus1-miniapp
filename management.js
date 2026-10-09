/* CAMPUS_MANAGEMENT_V14_AVATARS */
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
  const delay=maintenanceBlocked ? 10000 : 60000;
  maintenanceTimer=setTimeout(pollMaintenance,delay);
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
  if(!specialAuthorized()){
    return renderSpecial();
  }

  $('#view').innerHTML=
    pageHead(
      'Технические работы',
      'special'
    )+
    '<div class="task-center-loading">Проверяем состояние…</div>';

  try{
    const status=
      await apiRequest(
        'appGetMaintenanceStatus',
        [state.initData],
        {
          ttl:0,
          force:true
        }
      );

    $('#view').innerHTML=
      pageHead(
        'Технические работы',
        'special'
      )+
      `<div class="panel">
        <div class="task-diagnostic">
          <b>Состояние</b>
          <span class="badge">
            ${status.enabled
              ? 'Работы включены'
              : 'Приложение открыто'}
          </span>
        </div>

        <p>
          Все остальные пользователи,
          включая администрацию и активистов,
          блокируются. Доступ остаётся
          у владельца и разработчика.
        </p>

        <div class="field">
          <label for="maintenanceMessage">
            Сообщение пользователям
          </label>

          <textarea
            id="maintenanceMessage"
            maxlength="500"
          >${esc(status.message)}</textarea>
        </div>

        <button
          class="btn btn-secondary btn-wide"
          onclick="render('special-release-test')"
        >
          ✦ Проверить обновление
        </button>

        <button
          id="maintenanceToggle"
          class="btn ${status.enabled
            ? 'btn-primary'
            : 'btn-danger'} btn-wide"
          onclick="saveMaintenance(${!status.enabled})"
        >
          ${status.enabled
            ? 'Выключить технические работы'
            : 'Включить технические работы'}
        </button>

        <div class="task-note">
          Перед выключением рекомендуется
          запустить «Тестер обновления».
          После успешной проверки он сам
          предложит открыть приложение для всех.
        </div>
      </div>`;

  }catch(e){
    toast(e.message);
    renderSpecial();
  }
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
    $('#view').innerHTML=pageHead('Роли и секторы',back)+`<div class="task-note">Должность учитывается отдельно от прав доступа. После сохранения Campus проверяет новую роль на сервере.</div><div class="task-list">${councilRolesData.users.map(u=>`<button class="task-person role-person" onclick="editCouncilRole('${esc(u.id)}')">${avatarHtml(u.name,u.photoUrl)}<span><b>${esc(u.name)}</b><small>${esc(u.role)}<br>${esc(u.accessRole)} · ${esc(u.id)}</small></span><span class="role-edit">Изменить</span></button>`).join('')}</div>`;
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
  const role=
    $('#councilRole')?.value||'';

  const sector=
    $('#councilSector')?.value||'';

  if(
    (role==='sector_head'||
     role==='sector_deputy') &&
    !sector
  ){
    return toast(
      'Выберите сектор'
    );
  }

  const btn=
    $('#saveCouncilRole');

  if(btn){
    btn.disabled=true;
    btn.textContent='Сохраняем…';
  }

  try{
    await apiRequest(
      'appSetCouncilRole',
      [
        state.initData,
        id,
        role,
        sector
      ],
      {
        ttl:0,
        force:true
      }
    );

    const fresh=
      await apiRequest(
        'appGetCouncilRoles',
        [state.initData],
        {
          ttl:0,
          force:true
        }
      );

    const saved=
      fresh?.users?.find(
        user=>
          String(user.id)===
          String(id)
      );

    if(
      !saved ||
      saved.position?.roleId!==role
    ){
      throw new Error(
        'Сервер не подтвердил новую роль.'
      );
    }

    if(
      (role==='sector_head'||
       role==='sector_deputy') &&
      String(
        saved.position?.sector||''
      )!==String(sector)
    ){
      throw new Error(
        'Сервер не подтвердил выбранный сектор.'
      );
    }

    councilRolesData=fresh;

    if(
      String(state.user?.id)===
      String(id)
    ){
      state.user.role=
        saved.role;

      state.user.position=
        saved.position;

      try{
        const boot=
          await apiRequest(
            'appBootstrap',
            [state.initData],
            {
              ttl:0,
              force:true
            }
          );

        if(boot?.user){
          state.user=boot.user;
        }
      }catch(e){}
    }

    closeModal();

    toast(
      'Сохранено: '+
      saved.role
    );

    const back=
      state.currentPage===
        'special-users'
        ? 'special'
        : 'more';

    await renderCouncilRoles(back);

  }catch(e){
    toast(e.message);

    if(btn){
      btn.disabled=false;
      btn.textContent=
        'Сохранить роль';
    }
  }
}
