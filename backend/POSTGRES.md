# PostgreSQL на Windows

SQLite — справжня SQL-база, але PostgreSQL краще відповідає запланованому стеку
та розміщенню сервера. Тут підготовлено PostgreSQL 17 у Docker з постійним volume.

Команди нижче запускай у внутрішній папці `first-date-app`, де є `package.json`.

1. Відкрий Docker Desktop і дочекайся `Engine running`.
2. Запусти базу (перший запуск завантажить офіційний образ):

```powershell
.\backend\setup-postgres.ps1
```

Скрипт створить випадковий пароль у `backend/.env.postgres`. Він не друкується
в терміналі й виключений із Git. Збережи цей файл: зміна пароля у файлі не
змінює пароль уже створеної бази.

3. Зупини старий backend через Ctrl+C в його терміналі, щоб під час копіювання
ніхто не додавав нові відповіді у SQLite. Перевір і перенеси записи:

```powershell
.\backend\postgres.ps1 check
.\backend\postgres.ps1 migrate
```

`check` підключається до PostgreSQL, створює таблицю за потреби та рахує нові записи,
але не копіює їх. `migrate` створює резервну SQLite-копію у `backend/data`, а потім
копіює записи однією транзакцією. Стару базу не видаляє. Повторний запуск пропускає
однакові записи; конфлікт ID з іншими даними перериває операцію без часткового запису.
Старі відповіді «незнати» також зберігаються як історичні дані.
Якщо старої SQLite-бази немає, пропусти перенесення.

4. Запусти backend із PostgreSQL:

```powershell
.\backend\postgres.ps1 start
```

5. В іншому терміналі запусти frontend та заповни анкету:

```powershell
npm run dev -- --host 0.0.0.0
```

6. Переглянь відповіді саме з PostgreSQL:

```powershell
.\backend\postgres.ps1 show
```

Звичайна команда `show_responses.py` без DATABASE_URL читає SQLite, тому після
переходу користуйся `postgres.ps1 show`.

## Перегляд у графічній програмі

У встановленому pgAdmin або DBeaver створи PostgreSQL connection:

| Поле | Значення |
|---|---|
| Host | `127.0.0.1` |
| Port | `5433` |
| Database | `first_date` |
| User | `dateplanner` |
| Password | значення `POSTGRES_PASSWORD` з `backend/.env.postgres` |

Відкрий `public → Tables → responses`. Порт доступний лише на цьому комп'ютері.
Телефон як і раніше звертається до Vite, а не напряму до PostgreSQL.

## Зупинка та важливі межі

```powershell
docker compose --env-file backend/.env.postgres stop
```

Для повторного запуску — `setup-postgres.ps1`. Дані живуть у Docker volume;
не видаляй volume та не використовуй `down -v`, якщо хочеш зберегти відповіді.
Volume не замінює резервні копії. Це локальна конфігурація, не production deployment.
Міграції майбутніх змін таблиць ще потрібно додати; `create_all` створює нові таблиці,
але не оновлює їхню структуру.

Якщо PowerShell блокує `.ps1`, запускай команди через `powershell -NoProfile
-ExecutionPolicy Bypass -File .\backend\setup-postgres.ps1` (і аналогічно для
`postgres.ps1 start`). Це застосовується лише до окремого процесу.

У backend deployment потрібно включити папку `shared`: вона містить спільний
словник валідації. Фільтр відсіює відомі відписки, але не перевіряє реальність
закладів, страв чи кожної довільної фрази. Нові варіанти додавай у
`shared/answer-rules.json`; тести з цього файлу виконуються у JS та Python.

Джерело конфігурації: [Docker — PostgreSQL та збереження даних](https://docs.docker.com/guides/postgresql/immediate-setup-and-data-persistence/).
