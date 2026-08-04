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
      "description": "У тебя есть завершённые продажи в этом году."
    },
    {
      "code": "diplomat",
      "name": "Дипломат",
      "description": "Ты вёл много диалогов относительно просмотров."
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

|           |                                                        |     |
| --------- | ------------------------------------------------------ | --- |
| `code`    | Когда                                                  |     |
| `seller`  | доминируют listings + sells                            |     |
| `buyer`   | доминируют buys (+ сильный поиск/избранное к покупкам) |     |
| `watcher` | доминируют views/searches, мало сделок и сообщений     |     |
|           |                                                        |     |

## Блок 2 — `metrics[]`
Ровно **3** элемента.  
`selector` выбирает случайно среди **доступных** типов.
## Блок 3 — `achievements[]`
0…3 элемента.
## Блок 4 — `action`
Ровно **одно** действие.
Действия обговорим позже
# Contract C  HTTP JSON API
Назначение: контракт между frontend и backend.  
Frontend не считает роли/метрики/ачивки/действие — только рендерит объект `Recap` (Contract B).
Base URL (в браузере):
- `http://localhost/api` (через nginx proxy)
### 1) `GET /api/profiles`
*Для `GET /api/profiles` оставить прямой вызов repo*
Список тестовых пользователей для выбора на первом экране.
#### Response `200`
```
{
  "items": [
    {
      "id": 1,
      "username": "seller_anna",
      "imageUrl": "https://..."
    },
    {
      "id": 2,
      "username": "buyer_igor",
      "imageUrl": "https://..."
    }
  ]
}
```
### 2) `POST /api/recaps/generate`
Генерация (или перегенерация) итогов за год для пользователя.
#### Request body
```
{
  "userId": 1,
  "year": 2025
}
```
#### Поведение
- Если для пары `(userId, year)` recap ещё не существует — создаётся новый recap.
- Если recap уже существует — выполняется перегенерация и обновление существующего recap.
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
      "description": "У тебя есть завершённые продажи в этом году."
    },
    {
      "code": "diplomat",
      "name": "Дипломат",
      "description": "Ты вёл много диалогов относительно просмотров."
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
### 3) `GET /api/recaps/{recapId}`
Получить уже сгенерированные итоги.
#### Path params
- `recapId` (`int64`)
#### Response `200`
Тело = Contract B `Recap`.
### 4) `GET /api/health`
Проверка живости сервиса.
#### Response `200`
```
{
"status": "ok"
}
```
## Ошибки (единый формат)
Для всех endpoint:
```
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "year must be between 2000 and current year",
    "details": {
      "field": "year"
    }
  }
}
```
### Рекомендуемые коды
- `400 Bad Request` — невалидный body/params
- `404 Not Found` — пользователь или recap не найден
- `409 Conflict` — конфликт состояния (опционально)
- `500 Internal Server Error` — внутренняя ошибка