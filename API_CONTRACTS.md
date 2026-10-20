# API contracts

This is the working source of truth for the family banking API. The database
and ORM do not have to mirror response objects one-to-one: services assemble
responses from several tables and calculate derived values.

All endpoints use `/api/v1`. Authentication and parent-child authorization are
out of scope for the current read-only mock stage. `child_id` identifies a
resource but is not an authorization mechanism.

## Conventions

- IDs are UUID strings.
- Dates use `YYYY-MM-DD`; date-times use ISO 8601 with timezone.
- Money uses Python/SQL `Decimal` and is serialized as a JSON string.
- Amounts are non-negative; direction gives the financial meaning.
- The first release uses one family currency: `BYN`, `RUB`, `USD`, or `EUR`.
- Optional values are `null`; collections are always arrays.
- Default transaction period: the previous 30 calendar days through today in `Europe/Minsk`.
- Transactions are newest first by `occurred_at`, then `id`.

## Endpoints

### GET `/api/v1/family/my`

During the mock stage this endpoint accepts a required `family_id` query
parameter. Once authentication exists, the family will come from the current
parent context instead.

### GET `/api/v1/parent/children/{child_id}`

Optional query parameters: `date_from` and `date_to`.

Response sections:

- `child_info`: `id`, `name`, `birth_date`, computed `age`, `avatar_url`
- `balance_block`: `amount`, `currency`, `card_id`, `card_bank`, `card_type`, `card_mask`
- `money_categories.limit`: `limit_amount`, `frequency`, `spent_in_current_period`, `currency`
- `money_categories.piggy_bank`: `amount`, `currency`
- `most_recent_current_goal`: `id`, `title`, `current_amount`, `target_amount`, `currency`, or `null`
- `pocket_money_settings`: auto-transfer, amount, currency, recurrence, next date, and daily card limit, or `null`
- `pending_tasks[]`
- `transactions_history`: requested period and `items[]`

`balance_block`, `limit`, and `pocket_money_settings` can be `null`. Arrays
remain `[]` when there is no data.

### GET `/api/v1/parent/children/{child_id}/piggybank`

Returns `total_saved_amount`, `currency`, and `goals[]`. Each goal contains
`goal_id`, `title`, nullable `description`, `currency`, `current_amount`,
`target_amount`, `status` (`IN_PROGRESS`, `COMPLETED`, `ARCHIVED`), and
`created_at`.

The piggy bank is not a bank account. It is an allocation of the child's card
balance between active money and goal categories.

### GET `/api/v1/parent/children/{child_id}/tasks`

Returns `tasks[]`. Each task contains:

- `task_id`, `status`, `title`, `description`;
- `reward_amount`, `penalty_amount`, `currency`;
- nullable `rejection_comment`, `proof_photo_url`, `proof_submitted_at`, `deadline`;
- `created_at`;
- `created_by { parent_id, name, avatar_url }`;
- nullable `payout_source_card { card_id, card_mask }`.

`proof_photo_url` is nullable because not every task requires a photo.
`rejection_comment` is required only for `REJECTED_NEED_FIX`.

### GET `/api/v1/parent/children/{child_id}/transactions`

Optional query parameters: `date_from` and `date_to`.

Returns:

- `requested_period { date_from, date_to }`;
- `summary { total_income, total_outcome, currency }`;
- `items[]` with `transaction_id`, `title`, `timestamp`, `direction`, `amount`, `currency`, `category_code`, and `related_entity`.

`direction` is `INCOME` or `OUTCOME`. `category_code` is one of
`POCKET_MONEY`, `TASKS`, `SCHOOL_CAFE`, `BOOKSTORE`, `ENTERTAINMENT`,
`TRANSPORT`, or `OTHER`. `related_entity` contains `type` (`TASK`, `GOAL`, `SYSTEM`, `NONE`)
and nullable `id`.

### GET `/api/v1/parent/children/{child_id}/analytics`

Returns spending analytics for the parent view. Both query parameters are
required and interpreted in `Europe/Minsk`:

- `date_from=YYYY-MM-DD`
- `date_to=YYYY-MM-DD`

The response contains `total_spent`, the card currency, the requested period,
and category aggregates:

```json
{
  "total_spent": "decimal string",
  "currency": "BYN | RUB | USD | EUR",
  "date_from": "YYYY-MM-DD",
  "date_to": "YYYY-MM-DD",
  "categories": [
    {
      "category_code": "POCKET_MONEY | TASKS | SCHOOL_CAFE | BOOKSTORE | ENTERTAINMENT | TRANSPORT | OTHER",
      "category_title": "string",
      "total_amount": "decimal string",
      "percentage": "decimal string from 0 to 100"
    }
  ]
}
```

Analytics counts completed spending operations (`CARD_PURCHASE` and
`TASK_PENALTY`). Internal goal allocations and incoming pocket-money transfers
are not spending and are excluded. Categories are sorted by amount descending.
When there are no spending operations, `total_spent` is `0.00` and
`categories` is an empty array.

## Child application endpoints

These endpoints use the same domain services and database as the parent
endpoints, but have child-specific response shapes. The mock stage uses the
explicit `child_id`; authentication will later provide the current child
context.

### GET `/api/v1/child/{child_id}/dashboard`

Returns the child home screen:

- `child_info { name, avatar_url }`;
- `balance_block { active_balance, piggybank_balance, currency, card_mask }`;
- `goals[] { goal_id, title, current_amount, target_amount, currency }`;
- `tasks[] { task_id, title, reward_amount, currency, status }`;
- `recent_transactions[] { transaction_id, title, category_code, category_title, timestamp, direction, amount, currency }`.

`active_balance` is `cards.balance` minus the sum of active goal caches. The
piggy-bank balance is the sum of active goal caches. Recent transactions contain
the five newest completed operations.

### GET `/api/v1/child/{child_id}/piggybank`

Reuses the parent piggy-bank response and service. It returns
`total_saved_amount`, `currency`, and the complete `goals[]` list.

### GET `/api/v1/child/{child_id}/tasks`

Returns all tasks for the child, including all current statuses. The response
is the child-specific compact task shape: `task_id`, `title`, `reward_amount`,
`currency`, and `status`.

### GET `/api/v1/child/{child_id}/profile`

Returns `name`, `birth_date`, computed `age`, and nullable `avatar_url`.

### GET `/api/v1/child/{child_id}/analytics`

This child-facing route reuses the same analytics response and service as the
parent analytics endpoint: `/api/v1/parent/children/{child_id}/analytics`.

## ORM model overview

- `families`: family and primary currency.
- `users`: UUID, family, `user_type`, `parent_role`, name, required `birth_date`, avatar, activity status, timestamps. Age is calculated.
- `cards`: total balance, currency, bank/product names, four-digit mask, status, primary-card marker. There is no separate piggy-bank account.
- `goals`: child goal and cached `current_amount`.
- `money_limits`: active spending limits and periods.
- `pocket_money_settings`: automatic transfers, recurrence, next date, and daily card limit.
- `tasks`: current task state, proof, reward, penalty, deadline, creator, child, and payout card.
- `task_events`: every task status change, actor, comment, and timestamp.
- `transactions`: user-visible operations connected to cards, goals, tasks, and users.

`Goal.current_amount` is a cache. A goal contribution/withdrawal and its cache
update must happen in the same database transaction.

## Transaction storage

`transactions` stores the operation history rather than copying the API shape.
Important fields are:

- `card_id`: card shown in the child's history;
- nullable `source_card_id` and `destination_card_id`: card-to-card transfers;
- nullable `goal_id`: goal contribution or withdrawal;
- nullable `task_id`: task reward or penalty;
- `operation_type`: `CARD_TRANSFER`, `CARD_PURCHASE`, `TASK_REWARD`, `TASK_PENALTY`, `GOAL_CONTRIBUTION`, `GOAL_WITHDRAWAL`, or `SYSTEM_ADJUSTMENT`;
- `category_code`, positive `amount`, `currency`, `title`, and `status`;
- nullable `counterparty_name`: understandable other party such as `Школьное кафе`, `Мама Елена`, or `Moby`;
- `occurred_at`, optional `initiated_by_user_id`, and optional external reference.

Goal contributions are internal allocations: they change the cached goal amount
and calculated active balance, but do not change total card balance.

## Code organization

The code is organized by domain rather than by one file per application layer:

```text
app/
├── models/
│   ├── identity/       families and users
│   ├── money/          cards, goals, limits, pocket money, transactions
│   └── tasks/          tasks and task events
├── schemas/
│   ├── children/       child profile, dashboard, goals, tasks, transactions
│   └── family/         family response models
├── services/
│   └── children/       dashboard, family, piggy bank, tasks, transactions
└── routes/             thin HTTP adapters
```

Routes should stay thin: validation and HTTP status handling belong there, while
queries, joins, calculations, and response assembly belong in services.
Schemas describe transport contracts; ORM models describe persistence and may
have a different shape.

## Database structure

The database is an internal domain model. It is intentionally not a copy of
the HTTP response objects. The API layer joins these tables and formats the
result for each screen.

### Entity relationship map

```text
families 1 ──── * users
users    1 ──── * cards
users    1 ──── * goals                 (children only)
users    1 ──── * money_limits          (children only)
users    1 ──── 1 pocket_money_settings (children only)
users    1 ──── * tasks                 (as child)
users    1 ──── * tasks                 (as creator)
tasks    1 ──── * task_events
cards    1 ──── * transactions
goals    1 ──── * transactions
tasks    1 ──── * transactions
```

### `families`

| Column | Type | Nullable | Meaning |
| --- | --- | --- | --- |
| `id` | UUID | no | Family identifier |
| `currency` | `VARCHAR(3)` | no | Primary family currency |
| `created_at` | timestamp with timezone | no | Creation time |
| `updated_at` | timestamp with timezone | no | Last change time |

### `users`

| Column | Type | Nullable | Meaning |
| --- | --- | --- | --- |
| `id` | UUID | no | Public user identifier |
| `family_id` | UUID FK → `families.id` | no | User's family |
| `user_type` | enum-like string | no | `PARENT` or `CHILD` |
| `parent_role` | enum-like string | yes | `MOTHER`, `FATHER`, or `GUARDIAN`; only for parents |
| `name` | `VARCHAR(50)` | no | Display name |
| `birth_date` | date | no | Used to calculate age and age category |
| `avatar_url` | URL string | yes | Profile image |
| `is_active` | boolean | no | Soft deactivation flag |
| `created_at` | timestamp with timezone | no | Creation time |
| `updated_at` | timestamp with timezone | no | Last change time |

`age` is never stored. It is calculated from `birth_date` at response time.

### `cards`

| Column | Type | Nullable | Meaning |
| --- | --- | --- | --- |
| `id` | UUID | no | Card identifier |
| `owner_user_id` | UUID FK → `users.id` | no | Card owner |
| `balance` | `NUMERIC(15,2)` | no | Total balance including goal allocations |
| `currency` | `VARCHAR(3)` | no | Card currency |
| `bank_name` | `VARCHAR(100)` | no | Bank display name |
| `product_name` | `VARCHAR(100)` | no | Product/card name |
| `card_mask` | `VARCHAR(4)` | no | Last four digits only |
| `status` | enum-like string | no | `ACTIVE`, `BLOCKED`, or `EXPIRED` |
| `is_primary` | boolean | no | Card shown in the main child dashboard |
| `created_at` | timestamp with timezone | no | Creation time |
| `updated_at` | timestamp with timezone | no | Last change time |

There is no `piggy_bank_accounts` table. The piggy bank is an internal
allocation of `cards.balance`.

### `goals`

| Column | Type | Nullable | Meaning |
| --- | --- | --- | --- |
| `id` | UUID | no | Goal identifier |
| `child_id` | UUID FK → `users.id` | no | Child saving toward the goal |
| `title` | `VARCHAR(100)` | no | Goal title |
| `description` | `VARCHAR(500)` | yes | Goal explanation |
| `current_amount` | `NUMERIC(15,2)` | no | Cached saved amount |
| `target_amount` | `NUMERIC(15,2)` | no | Target amount |
| `currency` | `VARCHAR(3)` | no | Goal currency |
| `status` | enum-like string | no | `IN_PROGRESS`, `COMPLETED`, `ARCHIVED` |
| `created_at` | date | no | Creation date |
| `completed_at` | timestamp with timezone | yes | Completion time |

`current_amount` is updated together with the corresponding goal transaction
inside one database transaction.

### `money_limits`

| Column | Type | Nullable | Meaning |
| --- | --- | --- | --- |
| `id` | UUID | no | Limit identifier |
| `child_id` | UUID FK → `users.id` | no | Child the limit applies to |
| `limit_amount` | `NUMERIC(15,2)` | no | Allowed amount in the period |
| `frequency` | enum-like string | no | `DAILY`, `WEEKLY`, or `MONTHLY` |
| `currency` | `VARCHAR(3)` | no | Limit currency |
| `is_active` | boolean | no | Current limit marker |
| `valid_from` | date | no | Start date |
| `valid_to` | date | yes | End date |

`spent_in_current_period` is calculated from completed purchase and penalty
transactions. It is not persisted in this table.

### `pocket_money_settings`

| Column | Type | Nullable | Meaning |
| --- | --- | --- | --- |
| `id` | UUID | no | Settings identifier |
| `child_id` | UUID FK → `users.id`, unique | no | One settings row per child |
| `is_auto_transfer_enabled` | boolean | no | Automatic transfer switch |
| `transfer_amount` | `NUMERIC(15,2)` | no | Amount per transfer |
| `currency` | `VARCHAR(3)` | no | Transfer currency |
| `frequency` | enum-like string | no | `DAILY`, `WEEKLY`, or `MONTHLY` |
| `day_of_week` | integer 1–7 | yes | Required except for daily recurrence |
| `transfer_time` | time | no | Local transfer time |
| `next_transfer_date` | date | yes | Next scheduled transfer |
| `card_spend_limit_daily` | `NUMERIC(15,2)` | yes | Daily card spending limit |

### `tasks`

| Column | Type | Nullable | Meaning |
| --- | --- | --- | --- |
| `id` | UUID | no | Task identifier |
| `child_id` | UUID FK → `users.id` | no | Assigned child |
| `created_by_user_id` | UUID FK → `users.id` | no | Parent who created the task |
| `payout_source_card_id` | UUID FK → `cards.id` | yes | Parent card for reward payout |
| `status` | enum-like string | no | Current task status |
| `title` | `VARCHAR(150)` | no | Short task title |
| `description` | `VARCHAR(500)` | no | Task details |
| `reward_amount` | `NUMERIC(15,2)` | no | Reward amount |
| `penalty_amount` | `NUMERIC(15,2)` | no | Penalty amount |
| `currency` | `VARCHAR(3)` | no | Task money currency |
| `proof_photo_url` | URL string | yes | Optional proof photo |
| `proof_submitted_at` | timestamp with timezone | yes | Proof submission time |
| `rejection_comment` | `VARCHAR(500)` | yes | Required when returned for fixes |
| `created_at` | timestamp with timezone | no | Creation time |
| `deadline` | timestamp with timezone | yes | Optional deadline |

### `task_events`

| Column | Type | Nullable | Meaning |
| --- | --- | --- | --- |
| `id` | UUID | no | Event identifier |
| `task_id` | UUID FK → `tasks.id` | no | Affected task |
| `actor_user_id` | UUID FK → `users.id` | no | User who changed the task |
| `from_status` | status string | yes | Previous status; null for creation |
| `to_status` | status string | no | New status |
| `comment` | `VARCHAR(500)` | yes | Review/rejection comment |
| `created_at` | timestamp with timezone | no | Event time |

### `transactions`

| Column | Type | Nullable | Meaning |
| --- | --- | --- | --- |
| `id` | UUID | no | Operation identifier |
| `card_id` | UUID FK → `cards.id` | no | Child card represented in history |
| `source_card_id` | UUID FK → `cards.id` | yes | Source card for a card transfer |
| `destination_card_id` | UUID FK → `cards.id` | yes | Destination card for a card transfer |
| `goal_id` | UUID FK → `goals.id` | yes | Related saving goal |
| `task_id` | UUID FK → `tasks.id` | yes | Related task |
| `initiated_by_user_id` | UUID FK → `users.id` | yes | User/system actor |
| `operation_type` | enum-like string | no | Operation kind |
| `category_code` | enum-like string | no | UI grouping category |
| `amount` | `NUMERIC(15,2)` | no | Positive amount |
| `currency` | `VARCHAR(3)` | no | Operation currency |
| `title` | `VARCHAR(150)` | no | UI title |
| `counterparty_name` | `VARCHAR(150)` | yes | Shop, parent, system, or other party |
| `status` | enum-like string | no | Processing state |
| `occurred_at` | timestamp with timezone | no | Business time |
| `created_at` | timestamp with timezone | no | Persistence time |
| `external_reference` | `VARCHAR(150)`, unique | yes | Idempotency-Key или ссылка внешнего провайдера |

For a goal contribution, `card_id` and `goal_id` are set while source and
destination cards remain null. The operation changes the cached goal amount
and calculated active balance but not total card balance.

## POST-контракты

Ниже описаны публичные POST-эндпоинты write API. Они используют
тот же префикс /api/v1 и UUID-идентификаторы, что и GET-контракты.

Для task write API в mock-stage обязательный заголовок `X-Actor-User-Id`
содержит UUID выбранного во frontend профиля. Это не механизм авторизации:
после добавления auth значение будет браться из authenticated context.

### Общие правила POST-запросов

- Деньги передаются строкой Decimal: "10.00", а не float.
- Суммы положительные, если прямо не указано иное.
- Валюта должна совпадать с валютой семьи и карты.
- Клиент не передаёт balance, direction, active_balance или piggybank_balance.
  Эти значения вычисляются сервером.
- Клиент не создаёт строки transactions и task_events напрямую. Они создаются
  доменным сервисом вместе с основной операцией.
- Финансовые операции выполняются атомарно: изменение баланса, изменение
  Goal.current_amount и создание ledger-записи происходят одной транзакцией.
- Для повторяемых финансовых запросов используется заголовок
  Idempotency-Key: string. Повтор с тем же ключом возвращает исходный результат
  и не создаёт вторую операцию.
- Успешное создание ресурса возвращает 201 Created.
- Успешное действие над существующим ресурсом возвращает 200 OK.
- Ошибка валидации — 422, отсутствие ресурса — 404, конфликт состояния — 409.
- Денежные значения в JSON-ответах сериализуются строками с двумя знаками.

### 1. create_family — создание семьи

POST /api/v1/families

Тело запроса:

~~~json
{
  "currency": "BYN"
}
~~~

currency — обязательная строка из BYN, RUB, USD, EUR.

Ответ 201 Created:

~~~json
{
  "family_id": "string (UUID)",
  "currency": "BYN",
  "created_at": "string (ISO 8601 date-time)"
}
~~~

### 2. create_child — создание профиля ребёнка

POST /api/v1/families/{family_id}/children

~~~json
{
  "name": "string (макс. 50 символов)",
  "birth_date": "string (date, YYYY-MM-DD)",
  "avatar_url": "string (url, может быть null)"
}
~~~

birth_date обязательна и не может быть null. Новый пользователь получает
user_type=CHILD. Карта, цели, лимиты и настройки автоматически не создаются.

Ответ 201 Created:

~~~json
{
  "child_info": {
    "id": "string (UUID)",
    "name": "string",
    "birth_date": "string (date, YYYY-MM-DD)",
    "age": "integer",
    "avatar_url": "string (url, может быть null)"
  }
}
~~~

### 3. create_parent — создание родителя

POST /api/v1/families/{family_id}/parents

Mock-stage endpoint для добавления родителя или опекуна. В production этот
сценарий будет заменён invitation/auth flow.

~~~json
{
  "name": "string (макс. 50 символов)",
  "birth_date": "string (date, YYYY-MM-DD)",
  "parent_role": "string (Enum: MOTHER, FATHER, GUARDIAN)",
  "avatar_url": "string (url, может быть null)"
}
~~~

### Отложено: приглашения в семью

Invitation endpoints не входят в текущий публичный API. До появления
аутентификации используется mock-stage `create_parent`. Таблица приглашений,
срок действия токена, доставка и accept flow будут спроектированы вместе с auth.

### 6. create_child_card — добавление карты ребёнка

POST /api/v1/parent/children/{child_id}/cards

~~~json
{
  "bank_name": "string (макс. 100 символов)",
  "product_name": "string (макс. 100 символов)",
  "card_mask": "string (ровно 4 цифры)",
  "currency": "string (Enum: BYN, RUB, USD, EUR)",
  "initial_balance": "decimal string (>= 0, default 0.00)"
}
~~~

Номер карты и CVV не принимаются и не хранятся. initial_balance разрешён
только в mock/demo режиме; в production баланс приходит от card provider.
У ребёнка может быть не более одной активной карты. Попытка создать вторую
возвращает 409. Единственную карту можно деактивировать и затем создать замену.

### 7. create_card_transfer — перевод между картами

POST /api/v1/cards/{card_id}/transfers

~~~json
{
  "destination_card_id": "string (UUID)",
  "amount": "decimal string (> 0)",
  "currency": "string",
  "title": "string (макс. 150 символов)",
  "counterparty_name": "string (может быть null)"
}
~~~

Сервис проверяет активность, принадлежность и валюту карт, наличие средств,
уменьшает source card, увеличивает destination card и создаёт CARD_TRANSFER.

### 8. top_up_card — пополнение карты

POST /api/v1/cards/{card_id}/top-ups

~~~json
{
  "amount": "decimal string (> 0)",
  "currency": "string",
  "title": "string (макс. 150 символов, default Пополнение карты)",
  "counterparty_name": "string (может быть null)"
}
~~~

Mock/demo endpoint. Увеличивает cards.balance и создаёт входящую ledger-запись.

### 9. create_card_adjustment — административная корректировка карты

POST /api/v1/cards/{card_id}/adjustments

~~~json
{
  "amount": "decimal string (> 0)",
  "direction": "string (Enum: INCOME, OUTCOME)",
  "reason": "string (макс. 150 символов)"
}
~~~

Создаёт SYSTEM_ADJUSTMENT. Endpoint недоступен обычному клиентскому приложению.

### 10. create_goal — создание цели

POST /api/v1/parent/children/{child_id}/goals

~~~json
{
  "title": "string (макс. 100 символов)",
  "description": "string (макс. 500 символов, может быть null)",
  "target_amount": "decimal string (> 0)",
  "currency": "string (Enum: BYN, RUB, USD, EUR)"
}
~~~

Новая цель получает current_amount=0.00 и status=IN_PROGRESS. Баланс карты
и transactions при создании цели не изменяются.

### 11. contribute_to_goal — пополнение цели

POST /api/v1/goals/{goal_id}/contributions

~~~json
{
  "amount": "decimal string (> 0)",
  "card_id": "string (UUID)",
  "title": "string (макс. 150 символов, optional)"
}
~~~

Сервис проверяет карту ребёнка и доступный активный баланс, увеличивает
Goal.current_amount и создаёт GOAL_CONTRIBUTION. Общий cards.balance не меняется.
Пополнение выше target_amount разрешено: current_amount может превышать
target_amount, а UI отображает цель как достигнутую или перевыполненную.

### 12. withdraw_from_goal — снятие денег с цели

POST /api/v1/goals/{goal_id}/withdrawals

~~~json
{
  "amount": "decimal string (> 0)",
  "card_id": "string (UUID)",
  "title": "string (макс. 150 символов, optional)"
}
~~~

Уменьшает current_amount, создаёт GOAL_WITHDRAWAL и увеличивает рассчитанный
active_balance. Общий cards.balance остаётся неизменным.

### 13. complete_goal — завершение цели

POST /api/v1/goals/{goal_id}/complete

Тело отсутствует. Переводит IN_PROGRESS в COMPLETED и заполняет completed_at.
Повторное завершение или завершение ARCHIVED возвращает 409.

### 14. archive_goal — архивирование цели

POST /api/v1/goals/{goal_id}/archive

Тело отсутствует. Переводит цель в ARCHIVED. История цели и transactions
сохраняются.

### 15. create_money_limit — создание лимита

POST /api/v1/parent/children/{child_id}/money-limits

~~~json
{
  "limit_amount": "decimal string (>= 0)",
  "frequency": "string (Enum: DAILY, WEEKLY, MONTHLY)",
  "currency": "string",
  "valid_from": "string (date, default today)",
  "valid_to": "string (date, может быть null)"
}
~~~

Если бизнес-правило оставляет один текущий лимит, создание новой активной
версии деактивирует предыдущую.

### 16. create_pocket_money_settings — создание настроек

POST /api/v1/parent/children/{child_id}/pocket-money-settings

~~~json
{
  "is_auto_transfer_enabled": "boolean",
  "transfer_amount": "decimal string (>= 0)",
  "currency": "string",
  "frequency": "string (Enum: DAILY, WEEKLY, MONTHLY)",
  "day_of_week": "integer (1-7, null для DAILY)",
  "transfer_time": "string (time, HH:MM:SS)",
  "next_transfer_date": "string (date, может быть null)",
  "card_spend_limit_daily": "decimal string (>= 0, может быть null)"
}
~~~

Для одного ребёнка допускается одна settings-запись. Если она уже существует,
POST возвращает 409; изменение выполняется через PUT/PATCH.

### 17. enable_pocket_money — включение автоматических переводов

POST /api/v1/parent/children/{child_id}/pocket-money-settings/enable

Проверяет наличие настроек, положительную сумму и карту ребёнка, затем
устанавливает is_auto_transfer_enabled=true.

### 18. disable_pocket_money — выключение автоматических переводов

POST /api/v1/parent/children/{child_id}/pocket-money-settings/disable

Устанавливает is_auto_transfer_enabled=false. История переводов не меняется.

### 19. transfer_pocket_money_now — немедленный перевод

POST /api/v1/parent/children/{child_id}/pocket-money-settings/transfer-now

~~~json
{
  "amount": "decimal string (> 0, optional)",
  "source_card_id": "string (UUID)",
  "title": "string (optional)"
}
~~~

Если amount не передан, используется transfer_amount из настроек. Создаётся
CARD_TRANSFER, обновляются балансы и рассчитывается next_transfer_date.

### 20. create_task — создание задания родителем

POST /api/v1/parent/children/{child_id}/tasks

Обязательный header: `X-Actor-User-Id: UUID родителя`.

~~~json
{
  "title": "string (макс. 150 символов)",
  "description": "string (макс. 500 символов)",
  "reward_amount": "decimal string (>= 0)",
  "penalty_amount": "decimal string (>= 0)",
  "currency": "string",
  "payout_source_card_id": "string (UUID, может быть null)",
  "deadline": "string (ISO 8601 date-time, может быть null)"
}
~~~

После создания status=IN_PROGRESS, proof_photo_url=null и создаётся task_event
с from_status=null и to_status=IN_PROGRESS. Если reward_amount или
penalty_amount больше нуля, payout_source_card_id обязателен, должен указывать
на активную карту действующего родителя, а у ребёнка должна быть активная
карта. Валюты семьи, задания и карт должны совпадать. Нарушение этих правил
возвращает 409.

Ответ 201 содержит полное текущее представление задачи:

~~~json
{
  "task_id": "string (UUID)",
  "child_id": "string (UUID)",
  "created_by_user_id": "string (UUID)",
  "payout_source_card_id": "string (UUID, может быть null)",
  "status": "IN_PROGRESS",
  "title": "string",
  "description": "string",
  "reward_amount": "decimal string",
  "penalty_amount": "decimal string",
  "currency": "BYN",
  "proof_photo_url": null,
  "proof_submitted_at": null,
  "rejection_comment": null,
  "created_at": "string (ISO 8601 date-time)",
  "deadline": "string (ISO 8601 date-time, может быть null)"
}
~~~

### 21. submit_task — отправка или повторная отправка на проверку

POST /api/v1/tasks/{task_id}/submit

Обязательный header: `X-Actor-User-Id: UUID ребёнка`. UUID должен совпадать с
child_id задачи.

~~~json
{
  "proof_photo_url": "string (url, может быть null)",
  "comment": "string (макс. 500 символов, может быть null)"
}
~~~

Переводит IN_PROGRESS или REJECTED_NEED_FIX в WAITING_REVIEW и создаёт
task_event. Фото необязательно. Переданный URL заменяет старый и обновляет
proof_submitted_at; если URL не передан при повторной отправке, старое фото
сохраняется. Текущий rejection_comment очищается, его история остаётся в
task_events.

### 22. approve_task — одобрение и выплата награды

POST /api/v1/tasks/{task_id}/approve

Обязательный header: `X-Actor-User-Id: UUID родителя`.
Для защиты выплаты от дублей рекомендуется передавать уникальный
`Idempotency-Key`. Тело отсутствует.

Разрешённый переход WAITING_REVIEW → COMPLETED. При reward > 0 сервис
блокирует обе карты, списывает сумму с сохранённой payout-карты, зачисляет её
на единственную активную карту ребёнка и создаёт TASK_REWARD. Изменение
балансов, ledger, task_event и статуса выполняется атомарно. Недостаток средств
или недоступная карта возвращают 409 без частичных изменений. Повтор с тем же
Idempotency-Key возвращает исходную транзакцию.

### 23. reject_task — возврат на доработку

POST /api/v1/tasks/{task_id}/reject

Обязательный header: `X-Actor-User-Id: UUID родителя`.

~~~json
{
  "rejection_comment": "string (обязателен, макс. 500 символов)"
}
~~~

Разрешённый переход WAITING_REVIEW → REJECTED_NEED_FIX и создание task_event.
Старое proof-фото сохраняется после возврата на доработку до отправки нового.

### 24. cancel_task — отмена задания и применение штрафа

POST /api/v1/tasks/{task_id}/cancel

Обязательный header: `X-Actor-User-Id: UUID родителя`.
Для денежной отмены рекомендуется передавать `Idempotency-Key`. Тело
отсутствует.

Разрешены переходы IN_PROGRESS → CANCELLED и REJECTED_NEED_FIX → CANCELLED.
Если penalty_amount больше нуля, сервис переводит ровно эту сумму с активного
баланса ребёнка на сохранённую payout-карту и создаёт TASK_PENALTY. Накопления
в неархивных целях недоступны для штрафа. При нехватке активного баланса
возвращается 409; статус, балансы, event и transaction не изменяются.

### Общий ответ task actions

submit, approve, reject и cancel возвращают 200 OK:

~~~json
{
  "task": {
    "task_id": "string (UUID)",
    "child_id": "string (UUID)",
    "created_by_user_id": "string (UUID)",
    "payout_source_card_id": "string (UUID, может быть null)",
    "status": "IN_PROGRESS | WAITING_REVIEW | REJECTED_NEED_FIX | COMPLETED | CANCELLED",
    "title": "string",
    "description": "string",
    "reward_amount": "decimal string",
    "penalty_amount": "decimal string",
    "currency": "BYN | RUB | USD | EUR",
    "proof_photo_url": "string (url, может быть null)",
    "proof_submitted_at": "string (ISO 8601, может быть null)",
    "rejection_comment": "string (может быть null)",
    "created_at": "string (ISO 8601)",
    "deadline": "string (ISO 8601, может быть null)"
  },
  "transaction": {
    "transaction_id": "string (UUID)",
    "card_id": "string (UUID карты ребёнка)",
    "source_card_id": "string (UUID)",
    "destination_card_id": "string (UUID)",
    "operation_type": "TASK_REWARD | TASK_PENALTY",
    "amount": "decimal string",
    "currency": "BYN | RUB | USD | EUR",
    "status": "COMPLETED",
    "occurred_at": "string (ISO 8601)"
  }
}
~~~

transaction равен null для submit/reject и для approve/cancel с нулевой
суммой.

### 25. create_pocket_money_transfer — перевод карманных денег

POST /api/v1/parent/children/{child_id}/pocket-money-transfers

~~~json
{
  "source_card_id": "string (UUID)",
  "amount": "decimal string (> 0)",
  "currency": "string",
  "title": "string (optional)"
}
~~~

Создаёт входящий для ребёнка CARD_TRANSFER с category_code=POCKET_MONEY,
уменьшает карту-источник и увеличивает карту ребёнка.

### 26. create_card_purchase — mock-покупка ребёнка

POST /api/v1/parent/children/{child_id}/purchases

~~~json
{
  "card_id": "string (UUID)",
  "amount": "decimal string (> 0)",
  "currency": "string",
  "category_code": "string (Enum: SCHOOL_CAFE, BOOKSTORE, ENTERTAINMENT, TRANSPORT, OTHER)",
  "title": "string (макс. 150 символов)",
  "counterparty_name": "string (макс. 150 символов, может быть null)"
}
~~~

Проверяет баланс, уменьшает cards.balance и создаёт completed CARD_PURCHASE.
direction вычисляется сервером как OUTCOME.

### Demo-данные

HTTP endpoints для reset/seed/scenarios не публикуются. Детерминированные
demo-данные загружаются локальным `scripts/seed_demo.sql`.

## POST-эндпоинты, которые создают ledger-операции

Прямой POST /api/v1/transactions не добавляется: он позволил бы создать
историю, не изменив реальные балансы и кеши.

Источниками transaction rows являются только:

- /cards/{card_id}/transfers;
- /cards/{card_id}/top-ups;
- /cards/{card_id}/adjustments;
- /goals/{goal_id}/contributions;
- /goals/{goal_id}/withdrawals;
- /parent/children/{child_id}/pocket-money-transfers;
- /parent/children/{child_id}/purchases;
- /tasks/{task_id}/approve;
- /tasks/{task_id}/cancel.

## Не POST: операции изменения существующих ресурсов

Следующие операции будут описаны отдельными PATCH/PUT/DELETE-контрактами:

- PATCH /api/v1/users/{user_id} — изменение профиля;
- PATCH /api/v1/cards/{card_id} — свойства карты;
- PATCH /api/v1/goals/{goal_id} — название и описание цели;
- PATCH /api/v1/tasks/{task_id} — редактирование до COMPLETED/CANCELLED;
- PATCH /api/v1/money-limits/{limit_id} — изменение лимита;
- PUT/PATCH /api/v1/parent/children/{child_id}/pocket-money-settings — настройки;
- DELETE /api/v1/goals/{goal_id} — логическое архивирование;
- DELETE /api/v1/cards/{card_id} — деактивация карты без удаления ledger.

Физическое удаление транзакций, задач с историей и task_events не допускается.

## Контракты GET-запросов

Parent-facing endpoints сгруппированы под /api/v1/parent и в Swagger имеют тег
Parent application. Child-facing endpoints используют /api/v1/child и тег
Child application. Старый префикс /api/v1/children не поддерживается.

### 1. health_check — проверка доступности API

GET /api/v1/health

Параметры отсутствуют. Endpoint не обращается к базе данных.

Ответ 200 OK:

~~~json
{
  "status": "ok"
}
~~~

### 2. get_my_family — получение состава семьи

GET /api/v1/family/my

Query-параметр mock-stage:

- family_id — обязательный UUID; после авторизации будет удалён из публичного
  контракта и определяться из контекста родителя.

Ответ 200 OK:

~~~json
{
  "family_id": "string (UUID)",
  "currency": "BYN",
  "parents": [
    {
      "id": "string (UUID)",
      "name": "string",
      "role": "MOTHER | FATHER | GUARDIAN",
      "avatar_url": "string (url, может быть null)"
    }
  ],
  "children": [
    {
      "id": "string (UUID)",
      "name": "string",
      "birth_date": "YYYY-MM-DD",
      "age": "integer",
      "avatar_url": "string (url, может быть null)"
    }
  ]
}
~~~

Если семья не найдена, возвращается 404.

### 3. get_child_for_parent — dashboard ребёнка для родителя

GET /api/v1/parent/children/{child_id}

Необязательные query-параметры:

- date_from — начало периода YYYY-MM-DD;
- date_to — конец периода YYYY-MM-DD;
- если период не передан, используются последние 30 календарных дней;
- date_from не может быть позже date_to.

Ответ 200 OK:

~~~json
{
  "child_info": {
    "id": "string (UUID)",
    "name": "string",
    "birth_date": "YYYY-MM-DD",
    "age": "integer",
    "avatar_url": "string (url, может быть null)"
  },
  "balance_block": {
    "amount": "decimal string",
    "currency": "BYN",
    "card_id": "string (UUID)",
    "card_bank": "string",
    "card_type": "string",
    "card_mask": "string (4 цифры)"
  },
  "money_categories": {
    "limit": {
      "limit_amount": "decimal string",
      "frequency": "DAILY | WEEKLY | MONTHLY",
      "spent_in_current_period": "decimal string",
      "currency": "BYN"
    },
    "piggy_bank": {
      "amount": "decimal string",
      "currency": "BYN"
    }
  },
  "most_recent_current_goal": {
    "id": "string (UUID)",
    "title": "string",
    "current_amount": "decimal string",
    "target_amount": "decimal string",
    "currency": "BYN"
  },
  "pocket_money_settings": "object или null",
  "pending_tasks": [],
  "transactions_history": {
    "period_start": "YYYY-MM-DD",
    "period_end": "YYYY-MM-DD",
    "items": []
  }
}
~~~

balance_block, limit, most_recent_current_goal и pocket_money_settings могут
быть null. Коллекции всегда возвращаются массивами.

### 4. get_child_piggybank_for_parent — копилка ребёнка

GET /api/v1/parent/children/{child_id}/piggybank

Ответ:

~~~json
{
  "total_saved_amount": "decimal string",
  "currency": "BYN",
  "goals": [
    {
      "goal_id": "string (UUID)",
      "title": "string",
      "description": "string или null",
      "currency": "BYN",
      "current_amount": "decimal string",
      "target_amount": "decimal string",
      "status": "IN_PROGRESS | COMPLETED | ARCHIVED",
      "created_at": "YYYY-MM-DD"
    }
  ]
}
~~~

Копилка не является отдельным счётом. total_saved_amount — сумма кешей
current_amount незархивированных целей.

### 5. get_child_tasks_for_parent — задания ребёнка

GET /api/v1/parent/children/{child_id}/tasks

Ответ:

~~~json
{
  "tasks": [
    {
      "task_id": "string (UUID)",
      "status": "IN_PROGRESS | WAITING_REVIEW | REJECTED_NEED_FIX | COMPLETED | CANCELLED",
      "title": "string",
      "description": "string",
      "reward_amount": "decimal string",
      "penalty_amount": "decimal string",
      "currency": "BYN",
      "proof_photo_url": "string (url) или null",
      "proof_submitted_at": "ISO 8601 date-time или null",
      "rejection_comment": "string или null",
      "deadline": "ISO 8601 date-time или null",
      "created_at": "ISO 8601 date-time",
      "created_by": {
        "parent_id": "string (UUID)",
        "name": "string",
        "avatar_url": "string (url) или null"
      },
      "payout_source_card": {
        "card_id": "string (UUID)",
        "card_mask": "string (4 цифры)"
      }
    }
  ]
}
~~~

payout_source_card может быть null. proof_photo_url необязателен для всех
статусов. rejection_comment обязателен только для REJECTED_NEED_FIX.

### 6. get_child_transactions_for_parent — история операций

GET /api/v1/parent/children/{child_id}/transactions

Query-параметры date_from и date_to необязательны; по умолчанию возвращаются
последние 30 дней. Сортировка: occurred_at DESC, затем id DESC.

~~~json
{
  "requested_period": {
    "date_from": "YYYY-MM-DD",
    "date_to": "YYYY-MM-DD"
  },
  "summary": {
    "total_income": "decimal string",
    "total_outcome": "decimal string",
    "currency": "BYN"
  },
  "items": [
    {
      "transaction_id": "string (UUID)",
      "title": "string",
      "timestamp": "ISO 8601 date-time",
      "direction": "INCOME | OUTCOME",
      "amount": "decimal string (> 0)",
      "currency": "BYN",
      "category_code": "POCKET_MONEY | TASKS | SCHOOL_CAFE | BOOKSTORE | ENTERTAINMENT | TRANSPORT | OTHER",
      "related_entity": {
        "type": "TASK | GOAL | SYSTEM | NONE",
        "id": "string (UUID) или null"
      }
    }
  ]
}
~~~

### 7. get_child_analytics_for_parent — аналитика расходов

GET /api/v1/parent/children/{child_id}/analytics

Обязательные query-параметры date_from и date_to в формате YYYY-MM-DD.

~~~json
{
  "total_spent": "decimal string",
  "currency": "BYN",
  "date_from": "YYYY-MM-DD",
  "date_to": "YYYY-MM-DD",
  "categories": [
    {
      "category_code": "string",
      "category_title": "string",
      "total_amount": "decimal string",
      "percentage": "decimal string (0-100)"
    }
  ]
}
~~~

Учитываются completed CARD_PURCHASE и TASK_PENALTY. Переводы и внутренние
операции копилки в расходы не входят.

### 8. get_my_dashboard — главная ребёнка

GET /api/v1/child/{child_id}/dashboard

~~~json
{
  "child_info": {
    "name": "string",
    "avatar_url": "string (url) или null"
  },
  "balance_block": {
    "active_balance": "decimal string",
    "piggybank_balance": "decimal string",
    "currency": "BYN",
    "card_mask": "string (4 цифры)"
  },
  "goals": [],
  "tasks": [],
  "recent_transactions": []
}
~~~

active_balance равен cards.balance минус сумма незархивированных целей.
Возвращаются пять последних completed операций. Ребёнок без основной карты
сейчас получает 404; это поведение можно изменить отдельным решением.

### 9. get_child_piggybank — копилка в детском приложении

GET /api/v1/child/{child_id}/piggybank

Переиспользует контракт и сервис parent-facing копилки из пункта 4.

### 10. get_child_tasks — задания в детском приложении

GET /api/v1/child/{child_id}/tasks

~~~json
{
  "tasks": [
    {
      "task_id": "string (UUID)",
      "title": "string",
      "reward_amount": "decimal string",
      "currency": "BYN",
      "status": "IN_PROGRESS | WAITING_REVIEW | REJECTED_NEED_FIX | COMPLETED | CANCELLED"
    }
  ]
}
~~~

### 11. get_child_profile — профиль ребёнка

GET /api/v1/child/{child_id}/profile

~~~json
{
  "name": "string",
  "birth_date": "YYYY-MM-DD",
  "age": "integer",
  "avatar_url": "string (url) или null"
}
~~~

age вычисляется сервером из обязательного birth_date.

### 12. get_child_analytics — аналитика в детском приложении

GET /api/v1/child/{child_id}/analytics

Переиспользует контракт и сервис parent-facing analytics из пункта 7.

## Контракты PATCH-запросов

PATCH изменяет только переданные поля. Пустой JSON-объект возвращает 422.

### 1. update_user — изменение профиля

PATCH /api/v1/users/{user_id}

~~~json
{
  "name": "string (макс. 50 символов, optional)",
  "birth_date": "YYYY-MM-DD (optional)",
  "avatar_url": "string (url) или null (optional)"
}
~~~

user_type, family_id и parent_role этим endpoint не изменяются.

### 2. update_card — изменение отображаемых свойств карты

PATCH /api/v1/cards/{card_id}

~~~json
{
  "bank_name": "string (optional)",
  "product_name": "string (optional)",
  "card_mask": "string (4 цифры, optional)",
  "status": "ACTIVE | BLOCKED | EXPIRED (optional)",
  "is_primary": "boolean (optional)"
}
~~~

balance и currency не изменяются обычным PATCH. Если карта становится primary,
остальные карты того же пользователя перестают быть primary. Для ребёнка
разрешена только одна ACTIVE-карта, и она всегда является primary.

### 3. update_goal — изменение цели

PATCH /api/v1/goals/{goal_id}

~~~json
{
  "title": "string (макс. 100 символов, optional)",
  "description": "string или null (optional)",
  "target_amount": "decimal string (> 0, optional)"
}
~~~

current_amount и status меняются только специализированными action endpoints.
target_amount может стать меньше current_amount, поскольку переполнение цели
разрешено.

### 4. update_task — редактирование задания

PATCH /api/v1/tasks/{task_id}

Обязательный header: `X-Actor-User-Id: UUID родителя`.

~~~json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "reward_amount": "decimal string (>= 0, optional)",
  "penalty_amount": "decimal string (>= 0, optional)",
  "currency": "BYN | RUB | USD | EUR (optional)",
  "payout_source_card_id": "string (UUID) или null (optional)",
  "deadline": "ISO 8601 date-time или null (optional)"
}
~~~

Редактирование разрешено любому родителю семьи во всех состояниях, кроме
COMPLETED и CANCELLED. При замене payout_source_card_id новая карта должна
принадлежать действующему родителю. Для денежных задач повторно проверяются
активная карта ребёнка, payout-карта и совпадение валют. status, proof и
review-поля этим endpoint не изменяются. Ответ содержит полное представление
задачи в формате create_task.

### 5. update_money_limit — изменение лимита

PATCH /api/v1/money-limits/{limit_id}

~~~json
{
  "limit_amount": "decimal string (>= 0, optional)",
  "frequency": "DAILY | WEEKLY | MONTHLY (optional)",
  "valid_from": "YYYY-MM-DD (optional)",
  "valid_to": "YYYY-MM-DD или null (optional)",
  "is_active": "boolean (optional)"
}
~~~

### 6. patch_pocket_money_settings — частичное изменение настроек

PATCH /api/v1/parent/children/{child_id}/pocket-money-settings

Принимает любое непустое подмножество полей из PUT-контракта ниже. При включении
автоперевода сервер валидирует сумму, расписание и карту-источник.

## Контракт PUT-запроса

### replace_pocket_money_settings — полная замена настроек

PUT /api/v1/parent/children/{child_id}/pocket-money-settings

~~~json
{
  "is_auto_transfer_enabled": "boolean",
  "transfer_amount": "decimal string (>= 0)",
  "currency": "BYN | RUB | USD | EUR",
  "frequency": "DAILY | WEEKLY | MONTHLY",
  "day_of_week": "integer 1-7 или null для DAILY",
  "transfer_time": "HH:MM:SS",
  "next_transfer_date": "YYYY-MM-DD или null",
  "card_spend_limit_daily": "decimal string (>= 0) или null"
}
~~~

PUT является идемпотентным: одинаковый запрос приводит к одинаковому состоянию.
Если settings ещё нет, endpoint создаёт запись; если есть — полностью заменяет.

## Контракты DELETE-запросов

DELETE выполняет логическое удаление. Финансовая история физически не удаляется.

### 1. archive_goal — удаление цели из активного списка

DELETE /api/v1/goals/{goal_id}

Устанавливает status=ARCHIVED. Накопленная сумма и связанные transactions
сохраняются. Ответ 204 No Content.

### 2. deactivate_card — деактивация карты

DELETE /api/v1/cards/{card_id}

Переводит карту в BLOCKED или отдельный архивный статус без удаления
transactions. Единственную primary-карту ребёнка можно деактивировать, после
чего ребёнок временно остаётся без активной карты. Для родителя primary-карту
нельзя деактивировать, пока не назначена замена. Ответ 204 No Content.
