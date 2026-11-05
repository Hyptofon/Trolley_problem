# Проблема вагонетки (The Trolley Problem)

Інтерактивний, адаптивний та доступний вебсайт для дослідження класичної морально-етичної дилеми «Проблема вагонетки» з анонімним навчальним голосуванням, візуальною SVG-анімацією, збереженням у приватній Google Таблиці через захищений Google Apps Script, серверним API на Cloudflare Pages Functions та захищеною панеллю організатора.

![Статус перевірок](https://img.shields.io/badge/Quality%20Gates-Passed-success)
![Покриття коду](https://img.shields.io/badge/Coverage-91%25-brightgreen)
![WCAG](https://img.shields.io/badge/WCAG-2.2%20AA-blue)
![Мова](https://img.shields.io/badge/UI-Українська-yellow)

---

## 1. Концепція та дилема

Проєкт реалізує **одну класичну ситуацію** мисленнєвого експерименту Філіппи Фут (1967):
- Некерована вагонетка мчить колією в напрямку **п'ятьох людей**, які не можуть врятуватися самостійно.
- Учасник стоїть біля стрілочного переводу та має **рівно два рішення**:
  1. `stay` — **«Не втручатися»**: вагонетка продовжує рух прямо, під прямою загрозою 5 людей. Фізичної дії не відбувається.
  2. `switch` — **«Перевести стрілку»**: стрілка перемикається, вагонетка повертає на бокову колію, де під загрозою опиняється 1 людина (рятуються 5).

> [!NOTE]
> У проєкті **немає** жодних додаткових сценаріїв, моральних повчань, збору персональних даних (імен, email, телефонів, геолокації), реєстрації чи суб'єктивної оцінки «правильності» вибору.

---

## 2. Архітектура рішення

```text
Учасник (Браузер)
  │
  ├── React 18 + Vite + TypeScript (strict) + Tailwind CSS + SVG анімація
  │
  └── POST /api/vote (Same-Origin, Cloudflare Pages Function)
         │
         └── POST Google Apps Script Web App (із додаванням серверного секрету)
                │ (LockService.getScriptLock + перевірка дублікатів)
                └── Приватна Google Таблиця (джерело істини)

Організатор (Адміністратор)
  │
  ├── Маршрут /admin (форма входу)
  │      │
  │      ├── POST /api/admin/login (серверна перевірка пароля → HttpOnly SameSite=Strict cookie)
  │      ├── GET /api/admin/session (перевірка HMAC підпису WebCrypto)
  │      ├── POST /api/admin/logout (видалення cookie)
  │      │
  │      └── GET /api/admin/stats (доступ лише з валідною cookie, Cache-Control: no-store)
  │             │
  │             └── POST Google Apps Script (action: 'stats')
  │                    └── Агрегація без розкриття приватних ID
  │
  └── Інтерфейс статистики та Презентаційний режим для великих екранів
```

### Чому саме така архітектура?
1. **Жодних витоків секретів:** Браузерний клієнт **ніколи** не викликає `script.google.com` напряму. Всі звернення проходять через Cloudflare Pages Functions. Ключі `APPS_SCRIPT_SHARED_SECRET`, `ADMIN_PASSWORD` та `ADMIN_SESSION_SECRET` доступні лише на серверній стороні та відсутні в клієнтському JS-бандлі.
2. **Вирішення проблем CORS та редиректів:** Google Apps Script повертає HTTP 302 редирект на `script.googleusercontent.com`. Серверний проксі Cloudflare Functions прозоро обробляє перенаправлення та повертає чистий JSON.
3. **Захист від дублікатів та race conditions:** У Google Apps Script використано `LockService.getScriptLock()` з гарантованим звільненням у блоці `finally`. Перший голос записується; повторний запит повертає статус `already_voted` без додавання нового рядка. Зміна відповіді не перезаписує початковий вибір.
4. **Приватність таблиці:** Google Sheet залишається суворо приватною (доступ лише у власника скрипта).

---

## 3. Анонімність та межі ідентифікації

- Для кожного відвідувача генерується випадковий криптографічний ідентифікатор `crypto.randomUUID()`, що зберігається у `localStorage`.
- Жодні персональні дані (IP-адреси, User-Agent, fingerprinting, cookies сторонніх сервісів) не збираються.
- **Чесне застереження:** Використання псевдонімного маркера браузера захищає від випадкового повторного голосування під час навчальної сесії, проте не гарантує суворого «одна людина — один голос» у юридичному/криптографічному сенсі, оскільки очищення сховища браузера або зміна пристрою створює новий маркер.

---

## 4. Доступність (WCAG 2.2 AA)

- **Контрастність:** Графітова темна палітра з високим контрастом тексту (білий/світлий текст на графітовому тлі).
- **Кольоронезалежність:** Рішення відрізняються не лише кольором, а й великим текстом, номерами («Рішення 1», «Рішення 2») та унікальними іконками.
- **Клавіатурне керування:** Повна доступність через `Tab`, `Enter`, `Space` із виразним `focus-visible` індикатором. Додано посилання швидкого переходу «Перейти до основного вмісту».
- **Скрінрідери:** Семантичні теги, описовий текстовий еквівалент сцени SVG, `aria-live` регіони для динамічних статусів та табличне дублювання графіків.
- **Підтримка `prefers-reduced-motion`:** Анімації вимикаються для користувачів із чутливістю до руху; додано кнопку «Пропустити анімацію».
- **Не-графічний наслідок:** Жодного насильства, крові чи травм. Наслідок подається символічно і текстово у нейтральному тоні.

---

## 5. Швидкий старт локально

### Встановлення залежностей:
```bash
npm install
```

### Режим 1: Локальна розробка інтерфейсу (Демо-режим)
Запуск швидкого дев-сервера Vite:
```bash
npm run dev
```
Сайт відкриється за адресою `http://localhost:5173`. Голоси та статистика працюють через вбудований локальний тестовий адаптер без потреби у зовнішньому Google-акаунті.

### Режим 2: Повностековий локальний запуск (Cloudflare Functions)
Для запуску сайту разом із Cloudflare Pages Functions через Wrangler:
```bash
# 1. Збірка клієнта
npm run build

# 2. Запуск локального сервера Cloudflare Pages Functions
npm run dev:full
```

---

## 6. Запуск перевірок та тестів

Проєкт містить повне автоматизоване покриття тестами (Unit, Google Apps Script logic mock, Backend Functions integration, React Testing Library frontend integration, Playwright E2E та Axe accessibility):

```bash
# Перевірка типів TypeScript
npm run typecheck

# Лінтинг коду
npm run lint

# Модульні та інтеграційні тести (Vitest)
npm run test

# Звіт про покриття тестами
npm run test:coverage

# Наскрізні E2E тести (Playwright Desktop, Mobile, Axe WCAG)
npm run test:e2e

# Production збірка
npm run build

# Повний ланцюг Quality Gates
npm run verify
```

---

## 7. Структура проєкту

```text
├── .github/workflows/ci.yml       # GitHub Actions CI пайплайн
├── .dev.vars.example              # Приклад секретів Cloudflare Pages Functions
├── functions/                     # Cloudflare Pages Functions (Server-side API)
│   ├── api/
│   │   ├── vote.ts                # POST /api/vote (проксі голосування)
│   │   └── admin/
│   │       ├── login.ts           # POST /api/admin/login (HMAC cookie auth)
│   │       ├── session.ts         # GET /api/admin/session (перевірка сесії)
│   │       ├── logout.ts          # POST /api/admin/logout (очищення сесії)
│   │       └── stats.ts           # GET /api/admin/stats (захищена статистика)
│   └── utils/
│       ├── auth.ts                # WebCrypto HMAC підпис та верифікація сесій
│       └── upstream.ts            # Клієнт Google Apps Script із обробкою 302
├── google-apps-script/
│   └── Code.js                    # Готовий production-код для Google Apps Script Web App
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx # Панель організатора, картки, автооновлення
│   │   │   ├── AdminLoginForm.tsx # Форма пароля адміністратора
│   │   │   ├── PresentationView.tsx # Презентаційний повноекранний режим
│   │   │   └── StatsChart.tsx     # Адаптивна SVG-діаграма зі screen-reader таблицею
│   │   ├── DecisionControls.tsx   # Дві доступні кнопки вибору
│   │   ├── ErrorAlert.tsx         # Повідомлення про збій із кнопкою «Спробувати ще раз»
│   │   ├── Footer.tsx             # Семантичний футер сайту
│   │   ├── Header.tsx             # Шапка із посиланням на дилему та адмінку
│   │   ├── OutcomeView.tsx        # Екран наслідку та подяки
│   │   └── TrolleyScene.tsx       # 2D адаптивна SVG-сцена розгалуження колій
│   ├── pages/
│   │   ├── AdminPage.tsx          # Маршрут /admin
│   │   ├── HomePage.tsx           # Головний маршрут /
│   │   └── NotFoundPage.tsx       # Сторінка 404
│   ├── services/
│   │   ├── api.ts                 # Клієнт API із AbortController та обробкою помилок
│   │   └── participant.ts         # UUID маркер та локальне сховище
│   ├── utils/
│   │   └── statsCalculator.ts     # Точні математичні обчислення відсотків
│   ├── App.tsx                    # Роутинг та розмітка
│   ├── index.css                  # Стилі Tailwind CSS та доступності
│   ├── main.tsx                   # Точка входу React
│   └── types/index.ts             # Типобезпечні контракти даних
├── tests/
│   ├── backend/                   # Інтеграційні тести Cloudflare Pages Functions
│   ├── e2e/                       # Playwright E2E тести (desktop, mobile, a11y)
│   ├── frontend/                  # React Testing Library тести компонентів
│   ├── gas/                       # Тести доменної логіки Google Apps Script
│   └── unit/                      # Модульні тести авторизації, UUID та відсотків
├── DEPLOYMENT.md                  # Детальна інструкція розгортання в Google та Cloudflare
├── TECHNICAL_SPECIFICATION.md     # Технічне завдання
└── package.json                   # Залежності та скрипти
```

---

## 8. Розгортання у Production

Детальні покрокові інструкції зі створення приватної Google Таблиці, налаштування Script Properties, публікації Google Apps Script Web App та налаштування секретів у Cloudflare Pages викладено у файлі [`DEPLOYMENT.md`](./DEPLOYMENT.md).
