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

### 4) `GET /api/users/{userId}/achievements`
Получить состояние достижений пользователя.

Перед формированием ответа backend:
1. обновляет накопительную статистику пользователя;
2. проверяет правила достижений;
3. выдаёт новые выполненные достижения;
4. рассчитывает прогресс по каждому правилу;
5. возвращает полученные, заблокированные достижения и дерево прогресса правил.

#### Path params
- `userId` (`int64`) — идентификатор пользователя.

#### Response `200`

```json
{
  "earned": [
    {
      "code": "streak_survivor",
      "name": "Несгибаемый",
      "description": "Были дни, когда Avito тебя не отпускал — серия без пропусков.",
      "earnedAt": "2026-08-12T12:00:00Z",
      "imageUrl": "/static/achievements/streak_survivor.png"
    }
  ],
  "locked": [
    {
      "code": "trust_badge",
      "name": "Знак доверия",
      "description": "Высокий рейтинг и успешные продажи.",
      "imageUrl": "/static/achievements/trust_badge.png"
    }
  ],
  "achievements_progress": [
    {
      "code": "trust_badge",
      "type": "all",
      "is_complete": false,
      "progress": 50,
      "children": [
        {
          "code": "trust_badge",
          "type": "condition",
          "is_complete": true,
          "progress": 100,
          "condition": {
            "metric": "seller_rating",
            "operator": ">=",
            "current": "4.9",
            "target": "4.8"
          }
        },
        {
          "code": "trust_badge",
          "type": "condition",
          "is_complete": false,
          "progress": 50,
          "condition": {
            "metric": "sells_count",
            "operator": ">=",
            "current": "1",
            "target": "2"
          }
        }
      ]
    }
  ]
}
```

#### `earned[]`
Полученные пользователем достижения.

Поля:
- `code` — уникальный код достижения;
- `name` — название;
- `description` — описание;
- `earnedAt` — дата и время получения;
- `imageUrl` — URL изображения достижения.

`earned` сортируется по `earnedAt` от новых к старым.

#### `locked[]`
Достижения, которые пользователь ещё не получил.

Поля:
- `code`;
- `name`;
- `description`;
- `imageUrl`.

#### `achievements_progress[]`
Результаты вычисления achievement rules.

Прогресс рассчитывает **backend**. Frontend не должен самостоятельно вычислять процент выполнения по `current` и `target`.

Каждый элемент — рекурсивное дерево `AchievementProgressResponse`, связанное с конкретным достижением по полю `code`.

Поля узла:

| Поле | Тип | Описание |
| --- | --- | --- |
| `code` | `string` | Уникальный код достижения, к которому относится дерево прогресса |
| `type` | `string` | Тип узла: `condition`, `all` или `any` |
| `is_complete` | `boolean` | Выполнен ли узел правила |
| `progress` | `number` | Прогресс узла в процентах от `0` до `100` |
| `condition` | `object`, optional | Данные конечного условия. Присутствуют у `condition` |
| `children` | `array`, optional | Дочерние правила. Присутствуют у составных `all` / `any` |

##### `condition`

```json
{
  "metric": "buys_count",
  "operator": ">=",
  "current": "3",
  "target": "5"
}
```

Поля:
- `metric` — название метрики;
- `operator` — оператор сравнения (`>=`, `>`, `<=`, `<`, `==`);
- `current` — текущее значение метрики;
- `target` — целевое значение из правила.

`current` и `target` передаются как строки.

Пример связи с заблокированным достижением:

```json
{
  "locked": [
    {
      "code": "trust_badge",
      "name": "Знак доверия",
      "description": "Высокий рейтинг и успешные продажи.",
      "imageUrl": "/static/achievements/trust_badge.png"
    }
  ],
  "achievements_progress": [
    {
      "code": "trust_badge",
      "type": "all",
      "is_complete": false,
      "progress": 75
    }
  ]
}
```

Frontend сопоставляет достижение и его прогресс по `code`.

##### Тип `condition`
Лист дерева. Содержит `condition` и не содержит дочерних правил.

```json
{
  "code": "shortlist_boarder",
  "type": "condition",
  "is_complete": false,
  "progress": 60,
  "condition": {
    "metric": "buys_count",
    "operator": ">=",
    "current": "3",
    "target": "5"
  }
}
```

##### Тип `all`
Составное правило. Выполнено только тогда, когда выполнены все дочерние правила.

##### Тип `any`
Составное правило. Выполнено, если выполнено хотя бы одно дочернее правило.

Дерево может быть вложенным: `all` и `any` могут содержать как `condition`, так и другие `all` / `any`.

Поле `code` позволяет frontend напрямую связать элемент `achievements_progress[]` с объектом из `earned[]` или `locked[]`. Связывать массивы по индексу не требуется.

В текущей реализации `code` передаётся также во вложенные узлы `children`, поэтому все узлы одного дерева содержат один и тот же код достижения.

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

### 6) `GET /api/users/{userId}/prediction`
Получить предсказание на следующий год в стиле печенья с предсказанием.

Это не аналитический прогноз, не ML-прогноз поведения пользователя и не обещание результата. Текст связан с Avito и нужен только как лёгкий позитивный контент для пользовательского сценария.

#### Path params
- `userId` (`int64`)

#### Example
```text
GET /api/users/1/prediction
```

Год не передаётся в query params. Backend использует единый активный год итогов и возвращает предсказание на следующий год.

`userId` используется для проверки существования пользователя и сохранения прежнего API-контракта. Пользовательские метрики в AI-запрос не передаются.

#### Response `200`
```json
{
  "userId": 910001,
  "year": 2027,
  "title": "Твоё предсказание на 2027",
  "text": "В следующем году тебя ждёт неожиданно выгодная находка. Главное — не пролистать её мимо.",
  "type": "fortune"
}
```

Поля:
- `userId` — идентификатор пользователя;
- `year` — год предсказания;
- `title` — заголовок карточки;
- `text` — короткий текст предсказания;
- `type` — тип ответа, всегда `fortune`.

Если внешний AI API недоступен или не настроен, backend возвращает безопасный локальный fallback-текст в том же формате.

#### Ошибки
- `400 VALIDATION_ERROR` — невалидный `userId`;
- `404 USER_NOT_FOUND` — пользователь не найден;
- `500 INTERNAL_ERROR` — ошибка repository/database.

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
