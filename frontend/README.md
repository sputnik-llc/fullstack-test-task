# Frontend

Интерфейс управления файлами:
- загрузка новых файлов;
- просмотр статусов обработки;
- просмотр алертов.

## Переменные окружения

Создайте `frontend/.env.local` на основе `frontend/.env.local.example`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_KEY=dev-api-key
```

## Локальный запуск

```bash
npm install
npm run dev
```

Откройте `http://localhost:3000`.

## Docker

Запуск обычно выполняется через корневой `docker-compose.dev.yml`.

Для отдельной сборки:

```bash
docker build -t fullstack-frontend .
docker run --rm -p 3000:3000 fullstack-frontend
```
