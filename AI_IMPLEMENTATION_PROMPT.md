# Промпт для Codex / AI coding agent

Ти — Senior Full-Stack Engineer, UI/UX Engineer, QA Automation Engineer і Security Reviewer. Працюй у **поточному репозиторії** та **РЕАЛЬНО реалізуй завершений вебпроєкт**, а не пропозицію, макет, перелік TODO чи план на майбутнє.

## Джерело істини та межі

1. Спочатку прочитай файл `TECHNICAL_SPECIFICATION.md` у корені проєкту. Якщо файл лежить за іншим шляхом — знайди його. Це обов'язкова продуктова специфікація. Якщо файл недоступний, використовуй вимоги нижче як мінімальний контракт і вкажи обмеження, а не вигадуй вміст відсутнього файлу.
2. Оглянь структуру репозиторію, package scripts, конфігурацію та наявні інструкції (`AGENTS.md`, README). Якщо репозиторій порожній — ініціалізуй його акуратно з нуля. Не переписуй сторонні проєкти, якщо репозиторій не призначений для цієї задачі.
3. Створи feature branch, якщо це git-репозиторій і це можливо; не роби force push. Працюй невеликими змістовними комітами (за можливості один файл/одна логічна зміна — окремий коміт, але не дроби нероздільні працюючі набори штучно). Не пуш/не деплой без явного дозволу.
4. Продукт має **ОДНУ класичну дилему вагонетки і РІВНО ДВА варіанти**: `stay` — «Не втручатися» (загроза п'ятьом), `switch` — «Перевести стрілку» (загроза одній людині). НІЯКИХ інших сценаріїв, додаткових опитувань, анкет, авторизації відвідувачів, реєстрацій і логіки «правильного» вибору.
5. Весь UI — українською. Код, типи, технічні назви — зрозумілою англійською. Мінімум непотрібних залежностей, жодної незавершеної демоверсії під виглядом результату.

## Рішення, яке потрібно реалізувати

**Стек:** React + Vite + TypeScript strict + Tailwind CSS + Motion/CSS/SVG для анімації + Recharts (або легка доступна SVG-діаграма) + React Router. Для API використай **Cloudflare Pages Functions** — serverless функції, що публікуються разом зі статичним сайтом. Дані зберігай у **приватній Google Sheet** через **Google Apps Script Web App**. Власну БД (PostgreSQL/Supabase/Firebase/D1/KV) і окремий традиційний сервер НЕ створюй.

### Архітектурний інваріант
Браузер → `POST /api/vote` (same origin, Cloudflare Pages Functions) → Google Apps Script (секрет додається сервером) → приватна Google Sheet. Адмінка → серверна перевірка пароля/сесії → `GET /api/admin/stats` → Apps Script → агрегати. **Заборонено** робити прямий браузерний `fetch` до `script.google.com`, передавати спільний секрет через Vite public env або відкривати Google Sheet публічно. Apps Script ContentService робить перенаправлення на `script.googleusercontent.com`; коректно оброби це в серверному проксі. Не підмінюй працездатність `mode: no-cors`, JSONP чи `iframe`.

### Frontend — основний екран `/`
- Авторський преміальний дизайн без шаблонного вигляду AI-dashboard: стилізована 2D SVG-сцена із розгалуженням колій, вагонеткою, 5 і 1 умовними силуетами, важелем. Кожна група підписана; на мобільному ніхто не зникає. Контрастна типографіка та продумана композиція.
- Чітко сформулюй дилему, обидва наслідки і дві великі кнопки **«Не втручатися»** та **«Перевести стрілку»**. Не створюй третю опцію/кнопку рішення.
- Реалізуй контрольовані стани `idle → submitting → recorded/already_voted → outcome`; при помилці `error → retry`. Відповідна коротка анімація вагона після серверного успіху; нейтральний текст результату й подяка. Ніякого графічного насильства.
- Під час запиту блокуй повторні натискання. Timeout чи помилка не означає успіх; retry з тим самим participantId і choice. Запам'ятовуй підтверджений вибір у браузері.
- Доступність: клавіатура, `aria-live`, видимий focus, семантичні контролі, WCAG 2.2 AA як ціль; `prefers-reduced-motion`, можливість пропуску анімації, коректні 360/390/768/1024/1440 px і 200% zoom.

### Публічне голосування і захист від дублікатів
- Створюй випадковий `crypto.randomUUID()` в браузері, зберігай у `localStorage`; не збирай імен/email/IP/фінгерпринтів.
- `POST /api/vote` отримує `{participantId, choice}`. Валідовуй типи, UUID, enum, довжину та content type на сервері; приймай лише `stay|switch`.
- У Google Sheet зберігай `timestamp`, псевдонімний `participantId`, `choice` (можеш хешувати маркер). Логіка «один голос на browser token» виконується **в Apps Script під `LockService.getScriptLock()`**, з гарантованим `finally` для звільнення lock.
- Перший голос додає рядок. Повтор із тим самим токеном — `already_voted`, **без нового рядка**. Інший вибір із тим самим токеном не переписує перший. Після клієнтського timeout повторний POST не подвоює голос.
- У документації чесно поясни, що без авторизації/ідентифікації немає справжнього захисту «одна людина — один голос». Не перебільшуй анонімність щодо платформних технічних логів.

### Google Apps Script
- У репозиторії має бути **повний готовий Apps Script код**, а не псевдокод: `doPost(e)`, безпечна валідація секрету з Script Properties, функція `setup` або еквівалент для таблиці, запис під lock, обчислення агрегатів, контрольовані структуровані відповіді, обробка виключень.
- Той самий захищений `doPost` обслуговує дії `vote` та `stats`; `stats` має повертати **лише агрегати**, а не таблицю з ідентифікаторами. **Жоден** `doGet` не має розкривати дані чи дозволяти запис голосів.
- Дані зберігати у приватному Spreadsheet, ідентифікатор якого встановлює користувач. Ніяких hardcoded Google ID, приватних URL чи секретів.
- Придатність до тестування: винеси доменну логіку у тестовані функції та реалізуй unit/integration тести із моками `SpreadsheetApp`, `PropertiesService`, `LockService` (або інший реалістичний test harness). Додатково перевір сценарій конкурентних записів.

### Захищена адмінпанель `/admin`
- На публічному `/admin` спочатку тільки форма пароля. Успішний вхід через `POST /api/admin/login` з серверним секретом `ADMIN_PASSWORD`, підписана WebCrypto HMAC HttpOnly cookie з обмеженим TTL, `SameSite=Strict`, `Secure` на HTTPS; на localhost коректне налаштування cookie. Жодного збереження пароля в browser storage.
- Секрет підпису `ADMIN_SESSION_SECRET` незалежний від пароля й Apps Script shared secret. Server-side перевірка для кожного `GET /api/admin/stats`; навіть пряме звернення без сесії → 401. `GET /api/admin/session`, `POST /api/admin/logout`. Перевірка Origin/CSRF для state-changing endpoints; захисні заголовки, `Cache-Control: no-store` на приватних даних. Відокрем frontend access control від справжнього backend auth.
- Адмінка в стилі всього сайту: **total**, голоси `stay`/`switch`, відсотки, діаграма, дата оновлення, refresh, автооновлення приблизно 15 секунд коли вкладка активна, порожній стан, loading/error/expired session, logout.
- Окремий презентаційний режим **у межах адмінпанелі** (не окреме публічне опитування): масштабний графік і великі відсотки, fullscreen з fallback без Fullscreen API. Не показуй live-results публічним користувачам до розкриття адміном.
- Для публічного хостингу передбач документоване обмеження rate limiting/WAF/Cloudflare Access для admin login. Не заявляй, що пароль без протидії перебору — абсолютний захист.

### Дизайн-система та UX
- Сформуй лаконічні дизайн-токени (кольори, типографіка, кроки відступів, border radius, motion duration). Сцена — власний SVG без неочевидних авторських прав; не підвантажуй випадкові зображення з Інтернету.
- Використовуй текстові labels, не покладайся тільки на червоний/зелений. Не зображай травм або смертей.
- Покажи короткий privacy note без зайвих юридичних обіцянок. Сторінка 404 має коректне посилання на `/`.

## Взаємодія, помилки, API

Запровадь типобезпечний контракт:
- `POST /api/vote` — `{participantId: string, choice: 'stay'|'switch'}` → `{status:'recorded'|'already_voted',choice:'stay'|'switch'}`.
- `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/session`.
- `GET /api/admin/stats` → `{total,stay,switch,stayPercent,switchPercent,updatedAt}`.
- Всі помилки в уніфікованому JSON `error.code`, `error.message`, правильний HTTP статус. Невірний ввід → 400, auth → 401, upstream unavailable → 502/503/504, метод → 405. Не пропускай stack traces/секрети в JSON.
- Невірний/неповний Apps Script response, redirect, сетевий timeout, lock busy, empty sheet, zero votes, large aggregate, reload, 401, private cache — обов'язково обробити.
- Відрізняй production від **локального деморежиму**, де дані тільки mock і явно позначені; ніяких демо-значень у реальному production API.

## Тести — обов'язкові й справжні

Налаштуй `Vitest + React Testing Library + Playwright + ESLint + TypeScript`, за можливості axe accessibility scans. Створи стійкі mock-дані й незалежні тести без реальних облікових даних Google.

**Unit:** валідація UUID/choice, підрахунок та відсотки (0, 1, 100, округлення, великі числа), генерація/збереження токена, state machine, результат обох рішень, session HMAC create/verify/expiry/tamper, обробка помилок.

**Frontend integration:** рівно 2 кнопки; голос `stay` і `switch`; подвійне натискання; запис тільки після 2xx; timeout + повтор із тим самим UUID; browser reload/already-voted; mobile; keyboard; reduced motion; admin 401/login/logout, порожній стан/коректна статистика/error/refresh/presentation mode.

**Backend integration:** перевірки same-origin API, некоректний метод/JSON/UUID/choice; відсутність секретів у відповіді; Apps Script redirect і bad response; upstream timeout; неавторизована статистика; invalid/expired session; origin/CSRF; Apps Script mocked Spreadsheet/Lock і duplicate/concurrency. Не мока́й саму бізнес-логіку, яку нібито тестуєш; мока́й тільки зовнішні сервіси.

**E2E:** Playwright два незалежні успішні маршрути голосування, retry, дедуплікація/reload, login failure/success, stats 401, stats visible after login, logout, responsive desktop + 390px mobile, presentation mode. Додай автоматичні axe-перевірки та README з ручним accessibility checklist.

**Quality gates** (виконуй реально, виправляй до успіху):
```bash
npm run typecheck
npm run lint
npm run test
npm run test:coverage
npm run test:e2e
npm run build
```
Додай `npm run verify` для основних локальних перевірок і мінімальний `.github/workflows/ci.yml` без автодеплою, з кешем npm. Тести мають іти без зовнішнього Google/Cloudflare доступу. Не використовуй `test.skip`, фіктивні PASS, зниження правил TypeScript, `@ts-ignore` без дуже вагомої причини, приховані фейкові дані.

## Організація роботи

1. Targeted repo audit, склади короткий checklist, не витрачай токени на зайві повні дампи файлів. Переглянь official/current документацію лише там, де є сумнів у Cloudflare Pages Functions / Google Apps Script API.
2. Збери повну кодову основу frontend, маршрути, SVG, animation і accessibility.
3. Реалізуй типи контрактів, Cloudflare Pages Functions, Apps Script код, client services, idempotency, secure admin session.
4. Реалізуй інтерфейс статистики/презентаційний режим.
5. Напиши і запусти unit, frontend integration, backend integration, mocked GAS та Playwright E2E. Виправ помилки, повтори перевірки, зроби production build.
6. Додай `README.md` українською, `.dev.vars.example`/`.env.example`, `DEPLOYMENT.md` з **дуже конкретними кроками**: створити приватну Google Sheet, вставити Apps Script, налаштувати Script Properties (`SPREADSHEET_ID`, `SHARED_SECRET`), виконати setup, Deploy as Web App (execute as owner, anonymous access), скопіювати `/exec` URL, налаштувати Cloudflare Pages secrets (`APPS_SCRIPT_URL`, `APPS_SCRIPT_SHARED_SECRET`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`), розгорнути Vite build і Functions **разом**, перевірити голос з іншого браузера й захищені stats. Додай локальну інструкцію UI-only demo та full stack dev через Wrangler, а також troubleshooting (403, redirect, CORS, cookies, broken Sheets permission, quotas).
7. Не розгортай production без доступу та дозволу. Якщо відсутні зовнішні ключі — завершуй **весь код** і **автотести**, але окремо познач `External setup pending` і наведи мінімальні ручні кроки. Не пиши, що production працює, якщо не проводив реальний smoke test.
8. Наприкінці сам виконай глибокий self-review: чи немає прихованих демо-даних, обходу `/admin`, витоку секретів, дублювання голосів, CORS/Google redirect проблем, порушення WCAG, race conditions, неправильної математики чи забутих тестів.

## Очікувана фінальна відповідь від тебе (агента)

Надай **короткий, але доказовий звіт**:
- Що саме створено і де лежать ключові файли.
- Команди, які **реально** запустив, і результати (`PASS/FAIL/NOT RUN`), скільки тестів пройшло.
- Що перевірив локально end-to-end, які кейси покриті.
- Git branch / commits (лише якщо реально створив).
- Що залишається **тільки через відсутність доступів до Google/Cloudflare**, із точними кроками без узагальнених фраз.
- Ніяких вигаданих відсотків покриття, зеленого CI, deployed URL, успішних інтеграцій або зовнішніх облікових даних.

**Definition of Done:** Код повний, UX завершений, дві опції працюють, збереження і статистика реалізовані, авторизація захищає серверний API, всі локально доступні тести та production build перевірені. Не зупиняйся на плані, не перепитуй про дрібниці, роби обґрунтовані рішення сам. Якщо зовнішні доступи недоступні, не маскуй цей факт під «повністю задеплоєно».
