/**
 * Google Apps Script Web App для анонімного збереження голосів «Проблема вагонетки»
 *
 * Налаштування в Script Properties:
 * - SPREADSHEET_ID: ідентифікатор вашої приватної Google Таблиці
 * - SHARED_SECRET: надійний спільний секретний ключ, узгоджений із Cloudflare Pages
 */

const SHEET_NAME = 'Votes';
const LOCK_TIMEOUT_MS = 25000;

/**
 * Отримує або автоматично визначає ID таблиці.
 * Якщо скрипт відкрито через "Розширення -> Apps Script", він автоматично
 * визначає активну таблицю та зберігає її ID у Script Properties.
 */
function getOrDetectSpreadsheetId() {
  const properties = PropertiesService.getScriptProperties();
  let id = properties.getProperty('SPREADSHEET_ID');

  if (!id) {
    try {
      if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getActiveSpreadsheet) {
        const active = SpreadsheetApp.getActiveSpreadsheet();
        if (active && active.getId) {
          id = active.getId();
          if (id) {
            properties.setProperty('SPREADSHEET_ID', id);
            Logger.log('Автоматично визначено та збережено SPREADSHEET_ID: ' + id);
          }
        }
      }
    } catch (_e) {
      // Ігноруємо, якщо скрипт автономний і немає активної таблиці
    }
  }

  return id;
}

/**
 * Ініціалізація структури таблиці. Запустіть один раз з редактора Apps Script.
 */
function setup() {
  const spreadsheetId = getOrDetectSpreadsheetId();

  if (!spreadsheetId) {
    throw new Error(
      'Script Property "SPREADSHEET_ID" не встановлено та не вдалося визначити активну таблицю! ' +
      'Перевірте Project Settings -> Script Properties -> SPREADSHEET_ID.'
    );
  }

  const ss = SpreadsheetApp.openById(spreadsheetId);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // Якщо таблиця порожня, створюємо шапку
  if (sheet.getLastRowNum() === 0) {
    const headers = [['Timestamp', 'Participant ID', 'Choice']];
    sheet.getRange(1, 1, 1, 3).setValues(headers);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
    sheet.getRange(1, 1, 1, 3).setBackground('#1c2430');
    sheet.getRange(1, 1, 1, 3).setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 3);
  }

  Logger.log('Таблицю успішно налаштовано.');
}

/**
 * Забороняємо GET запити з міркувань безпеки.
 */
function doGet() {
  return createJsonResponse(
    {
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'GET-запити заборонені. Використовуйте авторизований POST API.',
      },
    },
    405
  );
}

/**
 * Обробка POST-запитів для дій "vote" та "stats".
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse(
        { error: { code: 'EMPTY_BODY', message: 'Порожнє тіло запиту.' } },
        400
      );
    }

    let payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch {
      return createJsonResponse(
        { error: { code: 'INVALID_JSON', message: 'Некоректний JSON.' } },
        400
      );
    }

    const properties = PropertiesService.getScriptProperties();
    const expectedSecret = properties.getProperty('SHARED_SECRET');
    const spreadsheetId = properties.getProperty('SPREADSHEET_ID') || getOrDetectSpreadsheetId();

    if (!expectedSecret || !spreadsheetId) {
      return createJsonResponse(
        {
          error: {
            code: 'SERVER_MISCONFIGURED',
            message: 'Script Properties не налаштовано на стороні Google Apps Script (відсутній SHARED_SECRET або SPREADSHEET_ID).',
          },
        },
        500
      );
    }

    // Перевірка спільного секрету
    if (!payload.secret || payload.secret !== expectedSecret) {
      return createJsonResponse(
        { error: { code: 'FORBIDDEN', message: 'Невірний секретний ключ.' } },
        403
      );
    }

    const action = payload.action;

    if (action === 'vote') {
      return handleVote(payload, spreadsheetId);
    } else if (action === 'stats') {
      return handleStats(spreadsheetId);
    } else {
      return createJsonResponse(
        { error: { code: 'INVALID_ACTION', message: 'Невідома дія: ' + action } },
        400
      );
    }
  } catch (error) {
    return createJsonResponse(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error && error.message ? error.message : 'Непередбачена помилка скрипта.',
        },
      },
      500
    );
  }
}

/**
 * Запис голосу з ScriptLock для уникнення race conditions і дублювання.
 */
function handleVote(payload, spreadsheetId) {
  const participantId = payload.participantId;
  const choice = payload.choice;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!participantId || !uuidRegex.test(participantId)) {
    return createJsonResponse(
      { error: { code: 'INVALID_PARTICIPANT_ID', message: 'Невалідний UUID v4.' } },
      400
    );
  }

  if (choice !== 'stay' && choice !== 'switch') {
    return createJsonResponse(
      { error: { code: 'INVALID_CHOICE', message: 'Вибір має бути "stay" або "switch".' } },
      400
    );
  }

  const lock = LockService.getScriptLock();
  const hasLock = lock.tryLock(LOCK_TIMEOUT_MS);

  if (!hasLock) {
    return createJsonResponse(
      {
        error: {
          code: 'LOCK_TIMEOUT',
          message: 'Сервіс зайнятий іншим запитом. Будь ласка, спробуйте ще раз.',
        },
      },
      503
    );
  }

  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      setup();
      sheet = ss.getSheetByName(SHEET_NAME);
    }

    const lastRow = sheet.getLastRowNum();
    if (lastRow > 1) {
      // Перевіряємо стовпчик Participant ID (стовпчик B)
      const idRange = sheet.getRange(2, 2, lastRow - 1, 2).getValues();
      for (let i = 0; i < idRange.length; i++) {
        const existingId = idRange[i][0];
        const existingChoice = idRange[i][1];
        if (existingId === participantId) {
          return createJsonResponse({
            status: 'already_voted',
            choice: existingChoice || choice,
          });
        }
      }
    }

    // Додаємо новий запис
    const timestamp = new Date().toISOString();
    sheet.appendRow([timestamp, participantId, choice]);

    return createJsonResponse({
      status: 'recorded',
      choice: choice,
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Обчислення та повернення агрегованої статистики.
 */
function handleStats(spreadsheetId) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    return createJsonResponse({
      total: 0,
      stay: 0,
      switch: 0,
      stayPercent: 0,
      switchPercent: 0,
      updatedAt: new Date().toISOString(),
    });
  }

  const lastRow = sheet.getLastRowNum();
  let stay = 0;
  let switchCount = 0;

  if (lastRow > 1) {
    // Зчитуємо стовпчик Choice (стовпчик C)
    const choices = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
    for (let i = 0; i < choices.length; i++) {
      const val = choices[i][0];
      if (val === 'stay') {
        stay++;
      } else if (val === 'switch') {
        switchCount++;
      }
    }
  }

  const total = stay + switchCount;
  const stayPercent = total === 0 ? 0 : Math.round((stay / total) * 1000) / 10;
  const switchPercent = total === 0 ? 0 : Math.round((switchCount / total) * 1000) / 10;

  return createJsonResponse({
    total: total,
    stay: stay,
    switch: switchCount,
    stayPercent: stayPercent,
    switchPercent: switchPercent,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Допоміжна функція формування JSON відповіді ContentService.
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}

// Експорт для локального модульного тестування у Node/Vitest
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    setup: setup,
    doGet: doGet,
    doPost: doPost,
    handleVote: handleVote,
    handleStats: handleStats,
    SHEET_NAME: SHEET_NAME,
  };
}
