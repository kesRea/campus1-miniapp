/* CAMPUS_MINIAPP_API_V13_11 — AI removed, tasks + management enabled */
function handleCampusMiniAppApi_(e) {
  try {
    var raw = e && e.postData ? String(e.postData.contents || '') : '';
    if (!raw) throw new Error('Пустой API-запрос.');

    var request = JSON.parse(raw);
    var method = String(request.method || '');
    var args = Array.isArray(request.args) ? request.args : [];

    var api = {
      appBootstrap: appBootstrap,
      appGetDashboard: appGetDashboard,
      appGetAnalytics: appGetAnalytics,
      appSearchStudents: appSearchStudents,
      appGetStudents: appGetStudents,
      appGetStudent: appGetStudent,
      appGetRooms: appGetRooms,
      appGetRoom: appGetRoom,
      appAddStudent: appAddStudent,
      appUpdateStudent: appUpdateStudent,
      appMoveStudent: appMoveStudent,
      appEvictStudent: appEvictStudent,
      appGetForeigners: appGetForeigners,
      appGetCouncil: appGetCouncil,
      appGetControl: appGetControl,
      appGetJournal: appGetJournal,

      appGetTasks: appGetTasks,
      appGetTaskUsers: appGetTaskUsers,
      appCreateTask: appCreateTask,
      appGetTaskDetails: appGetTaskDetails,
      appDelegateTask: appDelegateTask,
      appSetTaskStatus: appSetTaskStatus,
      appCommentTask: appCommentTask,
      appGetTaskFeed: appGetTaskFeed,

      appGetSpecialAccess: appGetSpecialAccess,
      appGetMaintenanceStatus: appGetMaintenanceStatus,
      appSetMaintenance: appSetMaintenance,
      appGetCouncilRoles: appGetCouncilRoles,
      appSetCouncilRole: appSetCouncilRole,
      appRunReleaseDiagnostics: appRunReleaseDiagnostics
    };

    if (!api[method]) {
      throw new Error('Неизвестный API-метод: ' + method);
    }

    var result = api[method].apply(null, args);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, result: result }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        ok: false,
        error: error && error.message ? error.message : String(error)
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
