# First Date Planner — backend

Новий [кабінет власника та унікальні запрошення](OWNER.md) доступні на `/owner`.

Готове налаштування PostgreSQL на Windows та перенесення відповідей:
[POSTGRES.md](POSTGRES.md).

FastAPI приймає анкету, повторно перевіряє відповіді й зберігає їх через SQLAlchemy.
Локально використовується SQLite: `backend/data/planner.db`. Файл залишається після
перезапуску сервера. Чернетка у браузері до надсилання поки не зберігається.

## Запуск у PowerShell

Команди виконуються з папки frontend, де є `package.json`.

Перший запуск (Python 3.12+):

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
```

У поточному workspace середовище вже створене та бібліотеки встановлені.
Перевірені точні версії записані в `requirements.lock.txt`; для відтворення
цього середовища встановлюй залежності з нього замість `requirements.txt`.
На цьому комп'ютері Python також доступний за шляхом
`C:/Users/rekte/AppData/Local/Programs/Python/Python314/python.exe`.

Термінал 1 — backend:

```powershell
backend/.venv/Scripts/python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

Термінал 2 — frontend:

```powershell
npm run dev -- --host 0.0.0.0
```

Vite пересилає `/api` до backend. Це також працює з телефона через Network-адресу
Vite: Python-сервер не потрібно відкривати в локальну мережу.
Після зміни `vite.config.ts` перезапусти Vite, якщо він не перезапустився сам.

Документація локального API: http://127.0.0.1:8000/docs

## Перегляд відповідей власником

```powershell
backend/.venv/Scripts/python.exe backend/show_responses.py
```

Публічного GET для відповідей немає. Команда читає локальну базу, а приватний
кабінет та авторизацію буде додано пізніше. Не додавай `backend/data` до Git.

## PostgreSQL

Створи окрему порожню базу та встанови змінну середовища перед запуском backend:

```powershell
$env:DATABASE_URL = 'postgresql+psycopg://USER:PASSWORD@localhost:5432/first_date'
backend/.venv/Scripts/python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

Підстав власні дані з'єднання; спеціальні символи пароля в URL потрібно кодувати.
`.env` автоматично не читається. Видалити змінну для повернення до SQLite:
`Remove-Item Env:DATABASE_URL`.

Таблиця створюється під час запуску. Зміна URL не переносить наявні відповіді зі
SQLite до PostgreSQL. Для наступних змін схеми потрібні міграції; `create_all`
не змінює наявні таблиці. PostgreSQL у цьому середовищі ще не перевірений.

## Перевірки

```powershell
Set-Location backend
.venv/Scripts/python.exe -m pytest tests -q --basetemp .test-temp
```

Тести використовують окрему тимчасову SQLite-базу. Перевіряють збереження після
повторного відкриття файлу, валідацію, повторне надсилання й відсутність публічного читання.

## API та поточні межі

- `GET /api/health` — доступність процесу.
- `POST /api/responses` — збереження; поля мають snake_case та `submission_id` UUID.
- Повторення того самого UUID та даних повертає підтвердження без нового запису.
- Той самий UUID з іншими даними повертає 409.
- Дата й час — локальні побажання, не UTC-момент. Сервер допускає календарний
  день, який ще триває в UTC-12; frontend перевіряє сьогоднішню дату користувача.
- Унікальні запрошення й авторизація описані в `OWNER.md`. Production hosting
  та повний захист від спаму ще не реалізовані.
- Для production потрібне окреме налаштування `/api`: proxy Vite працює лише у dev.

Документація: [FastAPI — SQL databases](https://fastapi.tiangolo.com/tutorial/sql-databases/),
[SQLAlchemy — PostgreSQL](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html).
