## Тестовое задание: Fullstack (Python + React)

MVP-проект файлообменника:
- загрузка файлов;
- асинхронный анализ на подозрительный контент;
- генерация алертов по результатам обработки.

### Стек

- Backend: FastAPI + SQLAlchemy + Postgres + Celery + Redis
- Frontend: Next.js + React-Bootstrap
- Инфраструктура: Docker Compose

### Структура

- `backend` - API, модели, миграции и celery worker
- `frontend` - UI для загрузки файлов и просмотра статусов
- `docker-compose.dev.yml` - dev-окружение

### Prerequisites

- Docker + Docker Compose plugin
- Свободные порты: `3000`, `8000`, `5433`

### Настройка окружения

1. Создайте env-файл:
   - `cp .env.dev.example .env.dev` (Linux/macOS)
   - `copy .env.dev.example .env.dev` (Windows)
2. Для фронтенда создайте локальные переменные:
   - `cp frontend/.env.local.example frontend/.env.local` (Linux/macOS)
   - `copy frontend\.env.local.example frontend\.env.local` (Windows)

### Запуск

1. Поднимите сервисы:
   - `docker compose -f docker-compose.dev.yml up --build -d`
2. Примените миграции:
   - `docker compose -f docker-compose.dev.yml exec backend alembic upgrade head`
3. Проверьте статус:
   - `docker compose -f docker-compose.dev.yml ps`

### Доступ

- Frontend: `http://localhost:3000`
- Backend docs: `http://localhost:8000/docs`

### Безопасность в dev

- API защищен заголовком `x-api-key`.
- Значение берется из `API_KEY` в `.env.dev`.
- Фронтенд использует `NEXT_PUBLIC_API_KEY` из `frontend/.env.local`.

### Что проверять после запуска

- Можно загрузить файл из UI.
- Файл появляется в таблице со статусом `uploaded -> processing -> processed`.
- После обработки создается запись в алертах.
