# Контракты `avito-yearly-recaps-service`
Контракты фиксируют формат данных **на границах слоёв**.  
Внутренние таблицы БД могут меняться; эти объекты — нет (без согласования команды).
```text
БД / repository (Кирюха)
        │  Contract A: YearMetrics
        ▼
metrics + engine (Алина)
        │  Contract B: Recap (domain)
        ▼
api / dto (Илья)
        │  Contract C: HTTP JSON API
        ▼
frontend
```
---
# Contract A — `YearMetrics`
**Назначение:** всё, что нужно движку, чтобы собрать блоки 1–4, **уже агрегировано**.  
BE2 не пишет SQL.
- В бд указано  `NUMERIC(12,2)` но в метриках целые рубли  `48000` ← `ROUND(SUM(price))`
## Структура
```
{
  "userId": 1,
  "registrationDate": "2025-06-01T12:00:00Z",

  "viewsCount": 847,
  "searchesCount": 120,
  "favoritesCount": 15,
  "messagesPeopleCount": 37,
  "listingsCreatedCount": 8,
  "buysCount": 4,
  "sellsCount": 9,

  "spentAmount": 48000,
  "earnedAmount": 120000,

  "maxStreakDays": 14,
  "activeDays": 120,
  "yearsOnAvito": 6,

  "priceMin": 500,
  "priceMax": 150000,

  "sellerRating": 4.9,

  "favoriteBuyCategory": { "id": 1, "name": "Электроника" },
  "favoriteSellCategory": { "id": 3, "name": "Одежда и обувь" },

  "mostViewedListing": {
    "id": 2,
    "name": "iPhone 13 128GB",
    "city": "Москва",
    "imageUrl": "https://...",
    "viewsCount": 42
  },

  "bestReviewReceived": {
    "id": 5,
    "rating": 5,
    "text": "Всё четко, рекомендую"
  },
  "bestReviewLeft": {
    "id": 6,
    "rating": 5,
    "text": "Товар как в описании"
  },
  "viewsByCategory": [
    { "categoryId": 1, "categoryName": "Электроника", "views": 400 }
  ],
  "searchesByCategory": [
    { "categoryId": 1, "categoryName": "Электроника", "searches": 80 }
  ],
  "favorites": [
    { "listingId": 2, "categoryId": 1 },
    { "listingId": 8, "categoryId": 3 }
  ],
  "listingViewCounts": [
    { "listingId": 2, "categoryId": 1, "views": 42 }
  ],
  "messagedListingIds": [9],
  "ownListings": [
    {
      "id": 11,
      "categoryId": 3,
      "status": "active",
      "updatedAt": "2025-06-01T12:00:00Z",
      "viewsCount": 3
    }
  ]
}
```

# Contract B — `Recap` (результат генерации)
## Структура

```
{
  "id": 101,
  "userId": 1,
  "year": 2025,
  "createdAt": "2026-01-15T12:00:00Z",

  "role": {
    "code": "seller",
    "name": "Продавец",
    "title": "В этом году ты крутой продавец!",
    "subtitle": "Ты продал 9 товаров.",
    "why": "67% активности — создание объявлений и продажа товаров",
    "activitySharePercent": 67
  },

  "metrics": [
    {
      "type": "earned_amount",
      "title": "Твои продажи",
      "text": "Твои объявления отработали как подработка: 120 000 ₽ за год.",
      "highlights": ["120 000 ₽"],
      "payload": { "earnedAmount": 120000 }
    },
    {
      "type": "max_streak_days",
      "title": "Серия активности",
      "text": "Твой личный рекорд упорства — 14-дневная серия.",
      "highlights": ["14-дневная серия"],
      "payload": { "maxStreakDays": 14 }
    },
    {
      "type": "most_viewed_listing",
      "title": "Товар, к которому ты возвращался",
      "text": "Один лот не давал тебе покоя — iPhone 13 128GB.",
      "highlights": ["iPhone 13 128GB"],
      "payload": {
        "listingId": 2,
        "name": "iPhone 13 128GB",
        "imageUrl": "https://...",
        "viewsCount": 42
      }
    }
  ],

  "achievements": [
    {
      "code": "clean_sale",
      "name": "Чистая продажа",
      "description": "У тебя есть завершённые продажи в этом году.",
      "imageUrl": "/static/achievements/clean-sale.png"
    },
    {
      "code": "diplomat",
      "name": "Дипломат",
      "description": "Ты вёл много диалогов относительно просмотров.",
      "imageUrl": "/static/achievements/diplomat.png"
    }
  ],

  "action": {
    "type": "boost_listings",
    "label": "Обновить объявления",
    "reason": "Есть активные объявления с низким откликом.",
    "target": {
      "listingIds": [11],
      "categoryId": 3
    }
  },

  "debug": {
    "generatorVersion": "v1",
    "seedProfile": "seller_1"
  }
}
```
## Блок 1 — `role`

| `code`    | `name`         | Когда                                                  |
| --------- | -------------- | ------------------------------------------------------ |
| `seller`  | `Продавец`     | доминируют listings + sells                            |
| `buyer`   | `Покупатель`   | доминируют buys (+ сильный поиск/избранное к покупкам) |
| `watcher` | `Наблюдатель`  | доминируют views/searches, мало сделок и сообщений     |

Поля блока: `code`, `name`, `title`, `subtitle`, `why`, `activitySharePercent`.
`name` — короткое человекочитаемое название роли (не путать с `title`).

## Блок 2 — `metrics[]`
Ровно **3** элемента.  
`selector` выбирает случайно среди **доступных** типов.
## Блок 3 — `achievements[]`
0…3 элемента.  
Поля: `code`, `name`, `description`, `imageUrl`.
## Блок 4 — `action`
Ровно **одно** действие.
Действия обговорим позже
# Contract C  HTTP JSON API
Назначение: контракт между frontend и backend.  
Frontend не считает роли/метрики/ачивки/действие — только рендерит объект `Recap` (Contract B).
Base URL (в браузере):
- `http://localhost/api` (через nginx proxy)

Год итогов определяет backend. Frontend не передаёт `year` в запросах генерации, получения recap и статистики. Все эти endpoint используют единый активный год, заданный конфигурацией backend, например `RECAP_YEAR`.
### 1) `GET /api/profiles`
*Для `GET /api/profiles` оставить прямой вызов repo*
Список тестовых пользователей для выбора на первом экране.
Поле `currentYear` передаётся один раз на верхнем уровне ответа и содержит активный год итогов, определённый backend. Frontend использует его только для отображения и не отправляет обратно в запросах.
#### Response `200`
```
{
  "currentYear": 2026,
  "items": [
    {
      "id": 1,
      "username": "seller_anna",
      "imageUrl": "/static/users/seller_anna.png"
    },
    {
      "id": 2,
      "username": "buyer_igor",
      "imageUrl": "/static/users/buyer_igor.png"
    }
  ]
}
```
### 2) `POST /api/recaps/generate`
Генерация (или перегенерация) итогов за год для пользователя.
#### Request body
```
{
  "userId": 1
}
```
Год не принимается от frontend. Backend использует активный год итогов из своей конфигурации.
#### Поведение
- Если для пары `(userId, currentYear)` recap ещё не существует — создаётся новый recap.
- Если recap за активный год уже существует — выполняется перегенерация и обновление существующего recap.
#### Response
- `201 Created` — создан новый recap.
- `200 OK` — выполнена перегенерация существующего recap.
Тело ответа в обоих случаях = Contract B `Recap`:
```
{
  "id": 101,
  "userId": 1,
  "year": 2025,
  "createdAt": "2026-01-15T12:00:00Z",

  "role": {
    "code": "seller",
    "name": "Продавец",
    "title": "В этом году ты крутой продавец!",
    "subtitle": "Ты продал 9 товаров.",
    "why": "67% активности — создание объявлений и продажа товаров",
    "activitySharePercent": 67
  },

  "metrics": [
    {
      "type": "earned_amount",
      "title": "Твои продажи",
      "text": "Твои объявления отработали как подработка: 120 000 ₽ за год.",
      "highlights": ["120 000 ₽"],
      "payload": { "earnedAmount": 120000 }
    },
    {
      "type": "max_streak_days",
      "title": "Серия активности",
      "text": "Твой личный рекорд упорства — 14-дневная серия.",
      "highlights": ["14-дневная серия"],
      "payload": { "maxStreakDays": 14 }
    },
    {
      "type": "most_viewed_listing",
      "title": "Товар, к которому ты возвращался",
      "text": "Один лот не давал тебе покоя — iPhone 13 128GB.",
      "highlights": ["iPhone 13 128GB"],
      "payload": {
        "listingId": 2,
        "name": "iPhone 13 128GB",
        "imageUrl": "https://...",
        "viewsCount": 42
      }
    }
  ],

  "achievements": [
    {
      "code": "clean_sale",
      "name": "Чистая продажа",
      "description": "У тебя есть завершённые продажи в этом году.",
      "imageUrl": "/static/achievements/clean-sale.png"
    },
    {
      "code": "diplomat",
      "name": "Дипломат",
      "description": "Ты вёл много диалогов относительно просмотров.",
      "imageUrl": "/static/achievements/diplomat.png"
    }
  ],

  "action": {
    "type": "boost_listings",
    "label": "Обновить объявления",
    "reason": "Есть активные объявления с низким откликом.",
    "target": {
      "listingIds": [11],
      "categoryId": 3
    }
  },

  "debug": {
    "generatorVersion": "v1",
    "seedProfile": "seller_1"
  }
}
```
### 3) `GET /api/users/{userId}/recap`
Получить уже сгенерированные итоги пользователя за активный год.
#### Path params
- `userId` (`int64`) — идентификатор пользователя
#### Example
```text
GET /api/users/1/recap
```
Год не передаётся в path или query params. Backend использует тот же активный год, что и при генерации recap.
#### Response `200`
Тело ответа = Contract B `Recap`.

Если recap пользователя за активный год ещё не был сгенерирован, возвращается `404 Not Found`.

### 4) `GET /api/users/{userId}/achievements`
Получить каталог ачивок пользователя: полученные (включая прошлые годы) и ещё не полученные.
#### Path params
- `userId` (`int64`)
#### Response `200`
```
{
  "earned": [
    {
      "code": "diplomat",
      "name": "Дипломат",
      "description": "Кажется ты перепутал Avito с мессенджером.",
      "earnedAt": "2025-12-20T12:00:00Z",
      "imageUrl": "/static/achievements/diplomat.png"
    },
    {
      "code": "plot_twist",
      "name": "Неожиданный поворот",
      "description": "После паузы ты вернулся на площадку — сюжет года сделал виток.",
      "earnedAt": "2023-05-18T12:00:00Z",
      "imageUrl": "/static/achievements/plot-twist.png"
    }
  ],
  "locked": [
    {
      "code": "streak_survivor",
      "name": "Несгибаемый",
      "description": "Были дни, когда Avito тебя не отпускал — серия без пропусков.",
      "imageUrl": "/static/achievements/streak-survivor.png"
    }
  ]
}
```
- `earned` — ачивки пользователя; сортируются по `earnedAt` от новых к старым; у каждого элемента есть `imageUrl`.
- `locked` — ачивки из общего каталога, которых у пользователя ещё нет; без `earnedAt`; у каждого элемента есть `imageUrl`.
- Если у пользователя нет полученных ачивок, `earned` = `[]`.
- Если получены все ачивки каталога, `locked` = `[]`.

### 5) `GET /api/users/{userId}/stats`
Получить все агрегированные статы пользователя за активный год.
#### Path params
- `userId` (`int64`)
#### Example
```text
GET /api/users/1/stats
```
Год не передаётся в query params. Backend использует единый активный год итогов.
#### Response `200`
Тело ответа = Contract A `YearMetrics` для указанного пользователя и активного года.

### 6) `GET /static/{path}`
Получить статический файл изображения. Роут находится вне `/api` и используется браузером для загрузки картинок по значению `imageUrl`.

В MVP через `/static` раздаются:

- `/static/achievements/{filename}` — изображения ачивок;
- `/static/users/{filename}` — аватарки пользователей.

#### Examples
```text
GET /static/achievements/diplomat.png
GET /static/users/seller_anna.png
```

#### Response `200`
В ответ возвращается файл изображения с соответствующим `Content-Type`, например:

```text
Content-Type: image/png
```

В JSON-ответах backend поле `imageUrl` содержит HTTP-путь к нужному файлу, например:

```json
{
  "imageUrl": "/static/achievements/diplomat.png"
}
```

или для аватарки пользователя:

```json
{
  "imageUrl": "/static/users/seller_anna.png"
}
```

Если файл не найден, возвращается `404 Not Found`.

### 7) `GET /api/health`
Проверка живости сервиса.
#### Response `200`
```
{
  "status": "ok"
}
```
Frontend не может выбрать прошлый год через публичный API: параметр `year` отсутствует во всех endpoint, связанных с recap и статистикой.

## Ошибки (единый формат)
Для всех endpoint:
```
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "userId must be a positive integer",
    "details": {
      "field": "userId"
    }
  }
}
```
### Рекомендуемые коды
- `400 Bad Request` — невалидный body/params
- `404 Not Found` — пользователь или запрошенные данные не найдены
- `409 Conflict` — конфликт состояния (опционально)
- `500 Internal Server Error` — внутренняя ошибка