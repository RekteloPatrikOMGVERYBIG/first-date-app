# Vercel + Render

Цей файл описує розгортання; він не означає, що сайт уже опублікований.
Корінь Git-репозиторію має містити `package.json`, `backend`, `shared`, `render.yaml`.
Якщо ці файли вкладені в `first-date-app`, вибери цю папку як Root Directory на обох сервісах.

## 1. GitHub

Репозиторій: https://github.com/RekteloPatrikOMGVERYBIG/first-date-app

Завантажуй лише код. `.gitignore` виключає локальні паролі, `.env`, базу, кеші та
Python-середовище. Перед push перевір `git status` та список staged-файлів.
Папка `shared` обов'язкова для Python, тому Root Directory на Render не може бути `backend`.

## 2. Render PostgreSQL

У Render створи Postgres у вибраному регіоні та вибери тариф після перевірки
актуальної ціни й строку зберігання. Скопіюй Internal Database URL у секретні
налаштування backend. Локальні Docker-записи не переносяться автоматично.
На першому етапі хмарна база буде порожньою; локальна залишиться на комп'ютері.

## 3. Render FastAPI

Підключи репозиторій як Blueprint (`render.yaml`) або Web Service з такими параметрами:

- Runtime: Python; Python version: `3.14.6`.
- Build: `pip install -r backend/requirements.lock.txt`.
- Start: `python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port $PORT --workers 1`.
- Health check: `/api/health`.
- Регіон — той самий, що й у бази.

Секрети та змінні Render:

| Змінна | Значення |
|---|---|
| `DATABASE_URL` | Internal Database URL від Render Postgres |
| `OWNER_PASSWORD` | Випадковий пароль щонайменше 24 символи; можна скопіювати локальний із редактора |
| `APP_ENV` | `production` |
| `COOKIE_SECURE` | `1` |

Не записуй пароль або DATABASE_URL у GitHub/Vercel/frontend. Python автоматично
адаптує PostgreSQL URL під psycopg. У production відсутні секрети блокують запуск;
локальний файл пароля не створюється. Зберігай пароль у менеджері паролів.

Після успішного запуску перевір `https://YOUR-SERVICE.onrender.com/api/health`.
Безкоштовний web service може засинати: перший запит може вимагати повторної спроби.

## 4. Vercel

Коли є справжня адреса Render, у корені проєкту виконай:

```powershell
node scripts/configure-vercel.mjs https://YOUR-SERVICE.onrender.com
```

Команда створить `vercel.json`. Додай його до GitHub перед імпортом у Vercel.
Імпортуй той самий репозиторій, framework Vite, build `npm run build`, output `dist`.
API переправляється до Render через домен Vercel, тому cookie кабінету залишаються
на тому самому сайті. Переписування шляхів дозволяє відкривати `/owner` і `/invite/...` напряму.

## 5. Фінальна перевірка

1. На Vercel відкрий `/owner`, увійди паролем OWNER_PASSWORD.
2. Створи запрошення; відкрий його в приватному вікні або на телефоні через мобільний інтернет.
3. Надішли анкету й перевір статус та відповіді в кабінеті.
4. Онови сторінку запрошення: повторна анкета не повинна відкриватись.
5. Вийди з кабінету: його дані не повинні завантажуватись без входу.

Поточний throttle входу розрахований на один процес. Перед широкою публікацією
потрібні централізовані обмеження запитів, резервні копії й міграції схеми.
Наявні сесії не скасовуються автоматично при зміні OWNER_PASSWORD: вони живуть до
виходу чи завершення 8 годин. Це потрібно врахувати при ротації секрету.

Джерела: [Render Blueprint](https://render.com/docs/blueprint-spec),
[секрети Render](https://render.com/docs/configure-environment-variables),
[Vercel rewrites](https://vercel.com/docs/routing/rewrites).
