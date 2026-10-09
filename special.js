/* CAMPUS_SPECIAL_MANAGEMENT_V13_10 */
/* CAMPUS_SPECIAL_V13_9: privileged button; role verified by backend every time. */
/* V13.10: show the entry to locally identified privileged Telegram users.
   All protected pages still REQUIRE server-side appGetSpecialAccess. */
function localSpecialCandidate(){
 const id=String(state.user?.id||'');
 const telegramId=String(tg?.initDataUnsafe?.user?.id||'');
 // appBootstrap has already validated the signed Telegram initData.
 return !!id && !!telegramId && id===telegramId &&
   (state.user?.canOpenSpecial===true);
}
function syncSpecialButton(){
 const btn=$('#specialBtn');
 if(!btn)return;
 const allowed=!!state.special?.canOpen || localSpecialCandidate();
 btn.classList.toggle('hidden',!allowed);
 btn.title=state.special?.checkError ? 'Панель управления — требуется проверка сервера' : 'Специальная панель';
}
async function loadSpecialAccess(){
 try{
  const result=await apiRequest('appGetSpecialAccess',[state.initData],{ttl:0,force:true});
  if(!result || typeof result.canOpen!=='boolean')throw new Error('Некорректный ответ проверки прав.');
  state.special={...result,checkError:''};
 }catch(e){
  state.special={canOpen:false,checkError:String(e?.message||e||'Неизвестная ошибка сервера')};
  console.warn('Campus special access check:',e);
 }
 syncSpecialButton();
 return state.special;
}
async function renderSpecial(){
  $('#view').innerHTML=
    pageHead(
      'Панель управления',
      'home'
    )+
    '<div class="task-center-loading">Проверяем права…</div>';

  try{
    await loadSpecialAccess();

    const access=
      state.special;

    if(!access?.canOpen){
      const message=
        access?.checkError
          ? `Сервер не смог проверить права: ${esc(access.checkError)}.`
          : localSpecialCandidate()
            ? `Сервер не подтвердил доступ для Telegram ID ${esc(state.user?.id)}.`
            : 'Раздел доступен только владельцу и разработчику.';

      $('#view').innerHTML=
        pageHead(
          'Проверка доступа',
          'home'
        )+
        `<div class="task-empty">
          <b>Панель пока недоступна</b>
          <p>${message}</p>
          <button
            class="btn btn-secondary btn-wide"
            onclick="render('special')"
          >
            Повторить проверку
          </button>
        </div>`;

      return;
    }

    $('#view').innerHTML=
      `${pageHead(
        'Специальная панель',
        'home'
      )}
      <div class="special-hero">
        <span class="special-hero-icon">
          ${icon('shield')}
        </span>
        <div>
          <small>
            ${access.isOwner
              ? 'ВЛАДЕЛЕЦ'
              : 'РАЗРАБОТЧИК'}
          </small>
          <h2>
            Центр управления Campus №1
          </h2>
          <p>
            Технические настройки и проверка обновлений
          </p>
        </div>
      </div>

      <div class="section-heading">
        <h2>Разделы</h2>
      </div>

      <div class="more-grid">
        ${moreCard(
          'spark',
          'Тестер обновления',
          'Проверить всё перед снятием техработ',
          "render('special-release-test')"
        )}

        ${moreCard(
          'shield',
          'Технические работы',
          'Включить или выключить доступ',
          "render('special-maintenance')"
        )}

        ${moreCard(
          'users',
          'Роли и секторы',
          'Назначение должностей',
          "render('special-users')"
        )}

        ${moreCard(
          'chart',
          'Диагностика',
          'Статус API и приложения',
          "render('special-diagnostics')"
        )}

        ${moreCard(
          'sun',
          'Оформление',
          'Тема и сезон',
          "render('special-design')"
        )}

        ${moreCard(
          'book',
          'Версия и обновления',
          'История изменений',
          "showWhatsNew()"
        )}
      </div>

      <div class="task-note">
        Перед отключением технических работ запусти
        «Тестер обновления». Если есть ошибка,
        приложение покажет её отдельной строкой.
      </div>`;
  }catch(e){
    $('#view').innerHTML=
      pageHead(
        'Ошибка',
        'home'
      )+
      `<div class="task-empty">
        ${esc(e.message)}
      </div>`;
  }
}
function specialAuthorized(){return !!(state.special?.isOwner||state.special?.isDeveloper);}
async function renderSpecialUsers(){return renderCouncilRoles('special');}
async function renderSpecialDiagnostics(){
 if(!specialAuthorized())return renderSpecial();
 $('#view').innerHTML=pageHead('Диагностика','special')+'<div class="task-center-loading">Проверяем Campus API…</div>';
 const started=Date.now();
 try{const a=await apiRequest('appGetSpecialAccess',[state.initData],{ttl:0,force:true});
  const latency=Date.now()-started;
  $('#view').innerHTML=pageHead('Диагностика','special')+`<div class="panel"><div class="task-diagnostic"><b>API</b><span class="badge">Подключён</span></div><div class="task-diagnostic"><b>Время ответа</b><span>${latency} мс</span></div><div class="task-diagnostic"><b>Интерфейс</b><span>v${esc(APP_VERSION)}</span></div><div class="task-diagnostic"><b>Сервер</b><span>v${esc(a.appVersion||'—')}</span></div><div class="task-diagnostic"><b>Telegram ID</b><span>${esc(a.id)}</span></div><div class="task-diagnostic"><b>Доступ</b><span>${a.isOwner?'Владелец': 'Разработчик'}</span></div></div>`;
 }catch(e){$('#view').innerHTML=pageHead('Диагностика','special')+`<div class="task-empty">${esc(e.message)}<br><button class="btn btn-primary" onclick="render('special-diagnostics')">Повторить</button></div>`;}
}
function renderSpecialDesign(){
 if(!specialAuthorized())return renderSpecial();
 $('#view').innerHTML=pageHead('Оформление','special')+`<div class="panel"><div class="task-diagnostic"><b>Текущая тема</b><span>${state.theme==='dark'?'Тёмная':'Светлая'}</span></div><button class="btn btn-secondary btn-wide" onclick="toggleTheme();renderSpecialDesign()">Сменить тему</button>${state.special?.isOwner?'<button class="btn btn-primary btn-wide" onclick="openOwnerSeasonSettings()">🍂 Управление сезонами</button>':'<div class="task-note">Переключение сезонов доступно только владельцу.</div>'}</div>`;
}


let releaseTesterPassed=false;
let releaseTesterMaintenance=false;

function releaseTestStatusLabel(status){
  if(status==='pass')return 'OK';
  if(status==='warn')return 'Внимание';
  return 'Ошибка';
}

function releaseTestRow(item){
  const status=
    ['pass','warn','fail']
      .includes(item.status)
      ? item.status
      : 'fail';

  return `<div class="release-test-row ${status}">
    <span class="release-test-dot"></span>
    <span class="release-test-copy">
      <b>${esc(item.label)}</b>
      <small>${esc(item.detail||'')}</small>
    </span>
    <span class="release-test-status">
      ${releaseTestStatusLabel(status)}
    </span>
  </div>`;
}

async function renderReleaseTester(){
  if(!specialAuthorized()){
    return renderSpecial();
  }

  releaseTesterPassed=false;
  releaseTesterMaintenance=false;

  $('#view').innerHTML=
    `${pageHead(
      'Тестер обновления',
      'special'
    )}
    <section class="release-test-hero">
      <span class="release-test-hero-icon">
        ${icon('spark')}
      </span>
      <div>
        <small>OWNER / DEVELOPER</small>
        <h2>Проверка перед открытием</h2>
        <p>
          Проверим frontend, backend, роли,
          студсовет, активистов, задачи и API.
        </p>
      </div>
    </section>

    <div
      id="releaseTestSummary"
      class="release-test-summary"
    >
      <b>Тест ещё не запущен</b>
      <small>
        Оставь технические работы включёнными
        и запусти полную проверку.
      </small>
    </div>

    <div
      id="releaseTestResults"
      class="release-test-list"
    ></div>

    <button
      id="runReleaseTestBtn"
      class="btn btn-primary btn-wide"
      onclick="runReleaseTester()"
    >
      Запустить полную проверку
    </button>

    <div id="releaseTestFinish"></div>`;
}

/* CAMPUS_RELEASE_TEST_HOTFIX_14_1_3 */
async function runReleaseTester(){
  if(!specialAuthorized()){
    return renderSpecial();
  }

  const button=$('#runReleaseTestBtn');
  const results=$('#releaseTestResults');
  const summary=$('#releaseTestSummary');

  if(button){
    button.disabled=true;
    button.textContent='Проверяем…';
  }

  if(results){
    results.innerHTML=
      '<div class="task-center-loading">Проверяем обновление…</div>';
  }

  const tests=[];
  let maintenanceEnabled=false;

  const add=(status,label,detail)=>{
    tests.push({
      status:String(status||'fail'),
      label:String(label||'Проверка'),
      detail:String(detail||'')
    });
  };

  try{
    const response=
      await fetch(
        UPDATE_MANIFEST_URL+
        '?release_test='+
        Date.now(),
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

    const manifest=
      await response.json();

    const manifestVersion=
      String(
        manifest?.version||''
      );

    if(!manifestVersion){
      throw new Error(
        'version.json без версии'
      );
    }

    add(
      manifestVersion===APP_VERSION
        ? 'pass'
        : 'fail',
      'GitHub / version.json',
      manifestVersion===APP_VERSION
        ? `Frontend v${APP_VERSION} опубликован.`
        : `В приложении v${APP_VERSION}, а GitHub сообщает v${manifestVersion}.`
    );

  }catch(e){
    add(
      'fail',
      'GitHub / version.json',
      e.message||String(e)
    );
  }

  try{
    const started=Date.now();

    const diagnostic=
      await apiRequest(
        'appRunReleaseDiagnostics',
        [state.initData],
        {
          ttl:0,
          force:true,
          timeoutMs:35000
        }
      );

    const latency=
      Date.now()-started;

    const serverVersion=
      String(
        diagnostic?.serverVersion||''
      );

    maintenanceEnabled=
      !!diagnostic?.maintenance?.enabled;

    add(
      serverVersion===APP_VERSION
        ? 'pass'
        : 'fail',
      'Версии frontend / backend',
      serverVersion===APP_VERSION
        ? `Обе версии v${APP_VERSION}.`
        : `Frontend v${APP_VERSION}, backend v${serverVersion||'—'}.`
    );

    add(
      latency<8000
        ? 'pass'
        : latency<18000
          ? 'warn'
          : 'fail',
      'Скорость backend',
      `Полная серверная диагностика: ${latency} мс.`
    );

    (diagnostic?.tests||[])
      .forEach(item=>{
        add(
          item.status,
          item.label,
          item.detail
        );
      });

  }catch(e){
    add(
      'fail',
      'Backend / диагностика',
      e.message||String(e)
    );
  }

  add(
    typeof startAutomaticUpdateWatch==='function'
      ? 'pass'
      : 'fail',
    'Автообновление',
    typeof startAutomaticUpdateWatch==='function'
      ? 'Модуль автообновления загружен.'
      : 'Функция автообновления не найдена.'
  );

  add(
    typeof openQuickMove==='function'
      ? 'pass'
      : 'fail',
    'Быстрое переселение',
    typeof openQuickMove==='function'
      ? 'Модуль переселения загружен.'
      : 'Модуль переселения не найден.'
  );

  const failed=
    tests.filter(
      item=>item.status==='fail'
    ).length;

  const warnings=
    tests.filter(
      item=>item.status==='warn'
    ).length;

  releaseTesterPassed=
    failed===0;

  releaseTesterMaintenance=
    maintenanceEnabled;

  if(results){
    results.innerHTML=
      tests
        .map(releaseTestRow)
        .join('');
  }

  if(summary){
    summary.className=
      'release-test-summary '+
      (
        failed
          ? 'fail'
          : warnings
            ? 'warn'
            : 'pass'
      );

    summary.innerHTML=
      failed
        ? `<b>Найдены ошибки: ${failed}</b>
           <small>
             Технические работы пока не выключай.
             Исправь ошибки и запусти тест ещё раз.
           </small>`
        : `<b>Проверка пройдена</b>
           <small>
             Критических ошибок нет.
             ${warnings
               ? `Предупреждений: ${warnings}.`
               : 'Обновление готово к открытию.'}
           </small>`;
  }

  const finish=
    $('#releaseTestFinish');

  if(finish){
    finish.innerHTML=
      releaseTesterPassed &&
      releaseTesterMaintenance
        ? `<button
             class="btn btn-primary btn-wide"
             onclick="confirmReleaseAfterTests()"
           >
             ✓ Всё работает — выключить техработы
           </button>`
        : releaseTesterPassed
          ? `<div class="task-note release-ready-note">
               Проверка успешна. Технические работы уже выключены.
             </div>`
          : `<div class="task-note">
               Сначала исправь все строки со статусом «Ошибка».
             </div>`;
  }

  if(button){
    button.disabled=false;
    button.textContent=
      'Запустить проверку ещё раз';
  }

  try{
    tg?.HapticFeedback
      ?.notificationOccurred(
        failed
          ? 'error'
          : 'success'
      );
  }catch(e){}
}

function confirmReleaseAfterTests(){
  if(
    !releaseTesterPassed ||
    !releaseTesterMaintenance
  ){
    return toast(
      'Сначала запусти успешную проверку'
    );
  }

  showModal(`<div class="sheet-handle"></div>
    <h3>Открыть Campus для всех?</h3>
    <p class="document-modal-note">
      Все критические тесты пройдены.
      Технические работы будут выключены,
      и приложение автоматически откроется
      для администрации, активистов и остальных пользователей.
    </p>

    <button
      id="releaseOpenBtn"
      class="btn btn-primary btn-wide"
      onclick="openCampusAfterReleaseTest()"
    >
      Выключить техработы
    </button>

    <button
      class="btn btn-secondary btn-wide"
      onclick="closeModal()"
    >
      Отмена
    </button>
  `);
}

async function openCampusAfterReleaseTest(){
  const button=
    $('#releaseOpenBtn');

  if(button){
    button.disabled=true;
    button.textContent='Открываем…';
  }

  try{
    await apiRequest(
      'appSetMaintenance',
      [
        state.initData,
        false,
        ''
      ],
      {
        ttl:0,
        force:true
      }
    );

    closeModal();

    releaseTesterMaintenance=false;

    toast(
      'Технические работы выключены'
    );

    await renderReleaseTester();

  }catch(e){
    toast(e.message);

    if(button){
      button.disabled=false;
      button.textContent=
        'Выключить техработы';
    }
  }
}
