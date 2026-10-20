# Moby Bank / Moby Family — запуск в VS Code

## 1. Требования

- Node.js LTS (рекомендуется Node.js 20 или 22).
- pnpm (версия, совместимая с `packageManager` в корневом `package.json`).
- Git и VS Code.

## 2. Открыть проект

Откройте в VS Code **корень** репозитория `moby-bank`, а не папку `artifacts/moby-family`: проект использует pnpm workspace и локальный пакет API-клиента.

В терминале VS Code выполните:

```bash
git checkout fix/full-child-functional-api-mobile
corepack enable
pnpm install
```

Если ветка уже не переключается из-за локальных изменений, сначала сохраните их отдельным коммитом или через `git stash`.

## 3. Переменные окружения

Скопируйте `artifacts/moby-family/.env.example` в `artifacts/moby-family/.env.local` и проверьте значения:

- `VITE_API_BASE_URL` — базовый URL backend.
- `VITE_FAMILY_ID` — ID семьи, которую возвращает API.
- `VITE_PARENT_USER_ID` — ID родителя, используемый текущим интерфейсом.
- `VITE_CHILD_USER_ID` — ID ребёнка для тестового сценария.
- `VITE_PARENT_CARD_ID` — нужен для создания денежных заданий, если API требует карту-источник выплаты.

Значения ID в примере — тестовые значения, уже использованные в frontend. Если данные backend отличаются, возьмите реальные ID из его документации/БД. Не добавляйте секреты в `VITE_*`: эти переменные попадают в клиентский bundle.

## 4. Запуск

Из корня репозитория:

```bash
pnpm --filter @workspace/moby-family dev
```

Vite покажет локальный URL (обычно `http://localhost:5173`). Откройте его в браузере.

## 5. Проверка сборки и типов

```bash
pnpm --filter @workspace/moby-family typecheck
pnpm --filter @workspace/moby-family build
```

Сборка приложения должна создавать файлы в `artifacts/moby-family/dist/public`.

## 6. Проверка GET/POST

1. Откройте DevTools → Network.
2. Включите фильтр Fetch/XHR.
3. Проверьте, что GET-запросы возвращают успешный статус и JSON от backend.
4. Проверьте POST/PUT/PATCH/DELETE на тестовых данных и убедитесь, что после успешного изменения данные перечитываются.
5. Если браузер пишет `CORS`, `Failed to fetch` или `blocked by CORS policy`, это не исправляется одной только настройкой frontend: backend должен разрешать origin локального Vite и опубликованного сайта.
6. Если API возвращает `400`/ `422`, сравните путь и JSON-тело запроса с OpenAPI/Swagger backend. Не проверяйте мутации на реальных финансовых данных без тестового окружения.

## 7. Мобильная проверка

В Chrome откройте DevTools → Toggle device toolbar (`Ctrl+Shift+M) / `Cmd+Shift+M`) и проверьте ширины 320, 360, 390 и 430 px. Дополнительно проверьте сайт на настоящем телефоне.

## Важно про API-контракт

Frontend использует REST endpoints под `/api/v1`. Чтобы безопасно исправить несовпадающие POST-контракты, необходима доступная копия OpenAPI/Swagger или исходники backend. Эта инструкция не означает, что каждый endpoint уже проверен против работающего сервера.
