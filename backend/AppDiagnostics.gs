/* CAMPUS_RELEASE_DIAGNOSTICS_V13_12_5 */
function releaseDiagItem_(
  id,
  label,
  status,
  detail
) {
  return {
    id: String(id || ''),
    label: String(label || ''),
    status: String(status || 'fail'),
    detail: String(detail || '')
  };
}

function appRunReleaseDiagnostics(initData) {
  var session = getAppIdentity_(initData);

  if (
    !session.isOwner &&
    !session.isDeveloper
  ) {
    throw new Error(
      'Тестер обновления доступен только владельцу и разработчику.'
    );
  }

  var tests = [];
  var maintenance =
    getMaintenanceState_();

  tests.push(
    releaseDiagItem_(
      'auth',
      'Права владельца / разработчика',
      'pass',
      session.isOwner
        ? 'Вход подтверждён как владелец.'
        : 'Вход подтверждён как разработчик.'
    )
  );

  tests.push(
    releaseDiagItem_(
      'maintenance',
      'Режим технических работ',
      maintenance.enabled
        ? 'pass'
        : 'warn',
      maintenance.enabled
        ? 'Технические работы включены. Можно безопасно тестировать до открытия приложения для остальных.'
        : 'Технические работы выключены.'
    )
  );

  try {
    var roleSheet =
      ensureCouncilRoleSheet_();

    tests.push(
      releaseDiagItem_(
        'roles',
        'Хранилище ролей',
        'pass',
        'Campus_Роли доступен. Записей: ' +
          Math.max(
            0,
            roleSheet.getLastRow() - 1
          )
      )
    );
  } catch (e1) {
    tests.push(
      releaseDiagItem_(
        'roles',
        'Хранилище ролей',
        'fail',
        e1.message || String(e1)
      )
    );
  }

  try {
    var council =
      buildCouncilDirectoryTable_(
        'council'
      );

    var activists =
      buildCouncilDirectoryTable_(
        'activists'
      );

    tests.push(
      releaseDiagItem_(
        'council-sync',
        'Студсовет и активисты',
        'pass',
        'Студсовет: ' +
          council.rows.length +
          ', активисты: ' +
          activists.rows.length
      )
    );
  } catch (e2) {
    tests.push(
      releaseDiagItem_(
        'council-sync',
        'Студсовет и активисты',
        'fail',
        e2.message || String(e2)
      )
    );
  }

  try {
    var rooms =
      getCampusRooms_();

    tests.push(
      releaseDiagItem_(
        'rooms',
        'Комнаты',
        rooms.length
          ? 'pass'
          : 'fail',
        'Доступно комнат: ' +
          rooms.length
      )
    );
  } catch (e3) {
    tests.push(
      releaseDiagItem_(
        'rooms',
        'Комнаты',
        'fail',
        e3.message || String(e3)
      )
    );
  }

  try {
    var studentValues =
      getStudentDisplayRows_().values;

    tests.push(
      releaseDiagItem_(
        'students',
        'База студентов',
        'pass',
        'Строк данных: ' +
          Math.max(
            0,
            studentValues.length - 1
          )
      )
    );
  } catch (e4) {
    tests.push(
      releaseDiagItem_(
        'students',
        'База студентов',
        'fail',
        e4.message || String(e4)
      )
    );
  }

  try {
    if (
      typeof readAllTasks_ !==
      'function'
    ) {
      throw new Error(
        'Модуль задач не найден.'
      );
    }

    var tasks =
      readAllTasks_();

    tests.push(
      releaseDiagItem_(
        'tasks',
        'Задачи',
        'pass',
        'Хранилище задач доступно. Задач: ' +
          tasks.length
      )
    );
  } catch (e5) {
    tests.push(
      releaseDiagItem_(
        'tasks',
        'Задачи',
        'fail',
        e5.message || String(e5)
      )
    );
  }

  var failed =
    tests.filter(function(item) {
      return item.status === 'fail';
    }).length;

  var warnings =
    tests.filter(function(item) {
      return item.status === 'warn';
    }).length;

  return {
    ok: failed === 0,
    failed: failed,
    warnings: warnings,
    serverVersion:
      CAMPUS_BACKEND_VERSION_V13_12_5,
    developerId:
      CAMPUS_DEVELOPER_ID_V13_12_5,
    maintenance: maintenance,
    tests: tests
  };
}
