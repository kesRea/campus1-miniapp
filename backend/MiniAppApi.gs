function handleCampusMiniAppApi_(e) {
  try {
    const raw = e && e.postData ? String(e.postData.contents || '') : '';
    if (!raw) throw new Error('Пустой API-запрос.');

    const request = JSON.parse(raw);
    const method = String(request.method || '');
    const args = Array.isArray(request.args) ? request.args : [];

    const api = {
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
      appAskAI: appAskAI,
      appAIStatus: appAIStatus,
      appSetAIConfig: appSetAIConfig,
      appClearAIConfig: appClearAIConfig,
      appExecuteAIAction: appExecuteAIAction
    };

    if (!api[method]) throw new Error('Неизвестный API-метод: ' + method);

    const result = api[method].apply(null, args);

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
