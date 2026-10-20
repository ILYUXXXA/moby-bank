# Moby Bank — запуск и проверка в VS Code

Рабочая ветка: `fix/child-api-mobile`. Все изменения в этой ветке; `main` и опубликованная ветка не меняются автоматически.

## Требования

- Node.js 20 LTS или новее
- pnpm (через Corepack)
- VS Code и расширение ESLint (если проект использует его в вашей установке)
- доступность backend и его Swagger/OpenAPI документации

## 1. Клонировать и открыть проект

Откройте PowerShell или терминал VS Code:

```powershell
git clone https://github.com/ILYUXXXA/moby-bank.git
cd moby-bank
git fetch origin
git switch --track origin/fix/child-api-mobile
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
code .
```

Если репозиторий уже клонирован, выполните вместо clone:

```powershell
git fetch origin
git switch fix/child-api-mobile
git pull
pnpm install
```

## 2. Настроить адрес API

Создайте файл `artifacts/moby-family/.env.local` (он локальный, не коммитьте его) с адресом backend:

```env
VITE_API_BASE_URL=https://yelisei-project.onrender.com
VITE_FAMILY_ID=11111111-1111-4111-8111-111111111111
VITE_PARENT_USER_ID=11111111-1111-4111-8111-111111111101
VITE_PARENT_CARD_ID=
```

Укажите реальные IDs, которые существуют в backend базе. Приведённые UUID — демо-значения из frontend и могут не существовать на сервере. `VITE_PARENT_CARD_ID` нужен для денежных заданий, если backend требует карту родителя. Не помещайте секреты или токены в переменные `VITE_*`: они встраиваются в браузерный код.

Если backend запущен локально, укажите его реальный URL, например `http://localhost:8000`, только если это совпадает с портом из Swagger/backend config. После изменения env-файла перезапустите Vite.

## 3. Запустить frontend

Из корня репозитория:

```powershell
pnpm --filter @workspace/moby-family dev
```

Откройте адрес, который напечатает Vite (обычно http://localhost:5173).

## 4. Проверить типы и production-сборку

Из корня репозитория:

```powershell
pnpm --filter @workspace/moby-family typecheck
pnpm --filter @workspace/moby-family build
```

Сборка frontend создаёт файлы в `artifacts/moby-family/dist/public`.

## 5. Проверить GET и POST

1. Откройте DevTools в браузере: F12 → Network.
2. Выберите фильтр Fetch/XHR и перезагрузите приложение.
3. Проверьте GET семьи, профиля ребёнка, копилки, заданий, операций и аналитики.
4. Для POST/PATCH/PUT/DELETE выполните действие в интерфейсе и откройте запрос.
5. Смотрите URL, HTTP статус и Response. `401/403` обычно указывают на идентификатор/права; `404` — на неверный маршрут или ID; `422` — на формат/обязательные поля; `5xx` — на ошибку backend; CORS/OPTIONS — на разрешения origin на backend.
6. Успешный HTTP ответ ещё не гарантирует обновление UI: после операции соответствующий GET должен повторно загрузить данные.

GET-методы сейчас используют mock fallback при ошибке API, поэтому mock-данные могут отображаться даже при неработающем backend. Смотрите Console и Network и не считайте наличие данных доказательством успешного GET.

## Важно про backend и контракты

Frontend использует маршруты `/api/v1/...` и заголовок `X-Actor-User-Id` для операций, выполняемых от имени родителя/ребёнка. Точные маршруты, схемы запросов и роли должны совпадать с Swagger backend. Не меняйте backend ради обхода ошибки без проверки контракта.

На момент подготовки этой инструкции подключённый GitHub-инструмент не смог прочитать `WaitForMeee/yelisei-project` (ответ 404 — обычно репозиторий приватный или подключённый аккаунт не имеет доступа). Поэтому API-контракты нельзя честно подтвердить по исходникам backend в рамках этой сессии. Для точной проверки POST нужен доступ на чтение к этому репозиторию или экспорт OpenAPI/Swagger JSON. Сам репозиторий backend не изменяется.

## 6. Проверить мобильную адаптацию

В DevTools нажмите Ctrl+Shift+M и проверьте ширины 320, 360, 390 и 430 px. На телефоне приложение должно занимать всю ширину и высоту экрана без внешней рамки устройства. Проверьте, что модальные формы прокручиваются, кнопки не выходят за экран, а горизонтальная прокрутка появляется только внутри специально прокручиваемых списков.

## 7. Отправить изменения на проверку

```powershell
git status
git add .
git commit -m "fix: verify family API actions and mobile layout"
git push origin fix/child-api-mobile
```

Не выполняйте merge в `main` и не запускайте production deploy, пока не проверены Network-запросы и мобильный экран.
