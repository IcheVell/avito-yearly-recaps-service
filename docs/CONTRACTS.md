# Контракты `avito-yearly-recaps-service`

Документ описывает актуальные границы между repository, domain, HTTP API и frontend.
Источники истины для форматов:

| Граница               | Источник                                        |
| --------------------- | ----------------------------------------------- |
| Агрегированные данные | `backend/internal/domain/recap/year_metrics.go` |
| Полный recap          | `backend/internal/domain/recap/recap.go`        |
| HTTP DTO              | `backend/internal/api/dto/`                     |
| HTTP-маршруты         | `backend/internal/api/router.go`                |
| Frontend-нормализация | `frontend/src/shared/api/normalize*.ts`         |

Все названия JSON-полей чувствительны к регистру. Время передаётся в формате RFC 3339.
Массивы в HTTP-ответах нормализуются в `[]`, а не в `null`.

## Contract A — `YearMetrics`

`YearMetrics` — внутренний доменный объект с агрегированной активностью пользователя за
активный год. Repository заполняет его, а engine использует при выборе роли, метрик,
достижений и следующего действия.

### Скалярные поля

| Поле                   | Go-тип      | Примечание                     |
| ---------------------- | ----------- | ------------------------------ |
| `UserID`               | `int64`     | Идентификатор пользователя     |
| `RegistrationDate`     | `time.Time` | Дата регистрации               |
| `ViewsCount`           | `int64`     | Просмотры объявлений           |
| `SearchesCount`        | `int64`     | Поиски                         |
| `FavoritesCount`       | `int64`     | Добавления в избранное         |
| `MessagesPeopleCount`  | `int64`     | Количество начатых диалогов    |
| `ListingsCreatedCount` | `int64`     | Созданные объявления           |
| `BuysCount`            | `int64`     | Завершённые покупки            |
| `SellsCount`           | `int64`     | Завершённые продажи            |
| `SpentAmount`          | `*int64`    | Целые рубли или `nil`          |
| `EarnedAmount`         | `*int64`    | Целые рубли или `nil`          |
| `MaxStreakDays`        | `int64`     | Максимальная серия активности  |
| `ActiveDays`           | `int64`     | Активные дни                   |
| `YearsOnAvito`         | `int64`     | Полные годы с даты регистрации |
| `PriceMin`             | `*int64`    | Минимальная цена или `nil`     |
| `PriceMax`             | `*int64`    | Максимальная цена или `nil`    |
| `SellerRating`         | `*float64`  | Рейтинг или `nil`              |

### Вложенные данные

| Поле                   | Тип                         | Примечание                                 |
| ---------------------- | --------------------------- | ------------------------------------------ |
| `FavoriteBuyCategory`  | `*YearMetricsCategory`      | Любимая категория покупок                  |
| `FavoriteSellCategory` | `*YearMetricsCategory`      | Любимая категория продаж                   |
| `MostViewedListing`    | `*YearMetricsListing`       | Самое просматриваемое объявление           |
| `BestReviewReceived`   | `*YearMetricsReview`        | Лучший полученный отзыв                    |
| `BestReviewLeft`       | `*YearMetricsReview`        | Лучший оставленный отзыв                   |
| `ViewsByCategory`      | `[]YearMetricsViews`        | Просмотры по категориям                    |
| `SearchesByCategory`   | `[]YearMetricsSearches`     | Поиски по категориям                       |
| `Favorites`            | `[]YearMetricsFavorite`     | Избранное с данными объявления и категории |
| `ListingViewCounts`    | `[]YearMetricsListingCount` | Просмотры конкретных объявлений            |
| `MessagedListingIDs`   | `[]int64`                   | Объявления, по которым начат диалог        |
| `OwnListings`          | `[]YearMetricsOwnListing`   | Объявления пользователя                    |
| `YearAchievements`     | `[]YearAchievement`         | Выданные за активный год достижения        |

Внутренние элементы `Favorites`, `ListingViewCounts` и `OwnListings` содержат обогащённые
данные объявления: название, изображение, цену, город и название категории. Они нужны для
формирования `action.target.listings`, но полностью через `/stats` не публикуются.

## Contract B — `Recap`

Полный recap возвращается при генерации и при последующем получении итогов.

```json
{
  "id": 101,
  "userId": 910001,
  "year": 2026,
  "createdAt": "2026-08-12T12:00:00Z",
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
      "title": "Заработанная сумма",
      "text": "Твои объявления отработали как подработка: 120 000 ₽ за год.",
      "highlights": ["120 000 ₽"],
      "payload": {
        "earnedAmount": 120000
      }
    }
  ],
  "achievements": [
    {
      "code": "streak_survivor",
      "name": "Несгибаемый",
      "description": "Были дни, когда Avito тебя не отпускал — серия без пропусков.",
      "imageUrl": "/static/achievements/streak_survivor.png"
    }
  ],
  "action": {
    "type": "boost_listings",
    "label": "Обновить объявления",
    "reason": "Часть твоих объявлений потеряла отклик — стоит поднять их снова.",
    "target": {
      "listingIds": [11],
      "categoryId": 0,
      "listings": [
        {
          "id": 11,
          "name": "Велосипед",
          "imageUrl": "/static/listings/bike.jpg",
          "price": 15000,
          "status": "active",
          "categoryId": 3,
          "categoryName": "Транспорт",
          "viewsCount": 3,
          "updatedAt": "2026-07-01T12:00:00Z",
          "city": "Новосибирск"
        }
      ]
    }
  },
  "debug": {
    "generatorVersion": "v1",
    "seedProfile": "seller_1"
  }
}
```

Ограничения текущего генератора:

- `role` — ровно один объект; коды: `seller`, `buyer`, `watcher`;
- `metrics` — от 0 до 4 элементов: до двух `number`, одного `qualitative` и одного
  `comparison`;
- `achievements` — от 0 до 3 элементов;
- `action` — ровно один объект;
- `listingIds`, `listings`, `metrics`, `highlights` и `achievements` не бывают `null`.

### `action.target`

```ts
type RecapActionTarget = {
  listingIds: number[];
  categoryId: number;
  categoryName?: string;
  listings: ActionListingPreview[];
};

type ActionListingPreview = {
  id: number;
  name?: string;
  imageUrl?: string;
  price: number | null;
  status?: string;
  categoryId?: number;
  categoryName?: string;
  viewsCount?: number;
  updatedAt?: string;
  city?: string;
};
```

Если действие не связано с категорией, `categoryId` равен `0`, а `categoryName` отсутствует.
`price` присутствует всегда и может быть `null`; остальные неизвестные необязательные поля
не включаются в JSON.

Полный каталог кодов находится в [`CATALOG.md`](./CATALOG.md).

## Публичная share-карточка

Share-карточка — отдельный сохранённый снимок полного recap. В неё не входят `userId`,
`createdAt`, `action`, `debug`, payload метрик и описания достижений.

```json
{
  "year": 2026,
  "role": {
    "code": "seller",
    "name": "Продавец",
    "title": "В этом году ты крутой продавец!"
  },
  "metrics": [
    {
      "type": "earned_amount",
      "title": "Заработанная сумма",
      "text": "Твои объявления отработали как подработка: 120 000 ₽ за год.",
      "highlights": ["120 000 ₽"]
    }
  ],
  "achievements": [
    {
      "code": "streak_survivor",
      "name": "Несгибаемый",
      "imageUrl": "/static/achievements/streak_survivor.png"
    }
  ]
}
```

Токен хранится в `share_recaps`, срока действия и API для отзыва ссылки сейчас нет.

## Contract C — HTTP JSON API

Base URL в браузере:

- `http://localhost/api` — через frontend Nginx;
- `http://localhost:8081/api` — прямой локальный доступ к backend.

Активный год задаётся переменной backend `RECAP_YEAR`. Frontend не выбирает произвольный
год. Поле `year` в body генерации сохранено в DTO для совместимости, но backend игнорирует
его и использует настроенный год.

### Список маршрутов

| Method | Endpoint                           | Успех         | Назначение                        |
| ------ | ---------------------------------- | ------------- | --------------------------------- |
| `GET`  | `/api/health`                      | `200`         | Проверка живости                  |
| `GET`  | `/api/profiles`                    | `200`         | Тестовые профили и активный год   |
| `POST` | `/api/recaps/generate`             | `200` / `201` | Генерация или перегенерация recap |
| `GET`  | `/api/users/{userId}/recap`        | `200`         | Получение сохранённого recap      |
| `POST` | `/api/users/{userId}/recap/share`  | `201`         | Создание публичного снимка        |
| `GET`  | `/api/share/{token}`               | `200`         | Получение публичного снимка       |
| `GET`  | `/api/users/{userId}/achievements` | `200`         | Достижения и прогресс             |
| `GET`  | `/api/users/{userId}/stats`        | `200`         | Годовая статистика                |
| `GET`  | `/api/users/{userId}/prediction`   | `200`         | Предсказание на следующий год     |

### `GET /api/health`

```json
{
  "status": "ok"
}
```

### `GET /api/profiles`

Профили сортируются backend по `username`.

```json
{
  "currentYear": 2026,
  "items": [
    {
      "id": 910001,
      "username": "aferist_alina",
      "imageUrl": "/static/users/aferist_alina.jpg"
    }
  ]
}
```

### `POST /api/recaps/generate`

```json
{
  "userId": 910001
}
```

Тело должно содержать один JSON-объект размером не более 1 MiB. Неизвестные поля
отклоняются, за исключением поддерживаемого, но игнорируемого поля `year`.

- `201 Created` — recap для пары `(userId, RECAP_YEAR)` создан впервые;
- `200 OK` — существующий recap перегенерирован, его `id` и `createdAt` сохранены;
- тело успешного ответа соответствует `Recap`.

### `GET /api/users/{userId}/recap`

Возвращает сохранённый `Recap` за `RECAP_YEAR`. Если итогов ещё нет, возвращается
`404 RECAP_NOT_FOUND`.

### `POST /api/users/{userId}/recap/share`

Тело запроса не требуется. Backend получает уже сохранённый recap за активный год, создаёт
новый случайный токен и сохраняет отдельный публичный снимок.

#### Response `201`

```json
{
  "shareUrl": "/share/9285a995c07678383f7f788c34d63ff6"
}
```

Если recap ещё не создан, возвращается `404 RECAP_NOT_FOUND`.

### `GET /api/share/{token}`

Возвращает объект из раздела [«Публичная share-карточка»](#публичная-share-карточка).
Неизвестный токен возвращает `404 SHARE_NOT_FOUND`.

### `GET /api/users/{userId}/achievements`

Перед ответом backend обновляет накопительную статистику, проверяет правила и выдаёт новые
достижения. `earned` сортируется по `earnedAt` от новых к старым.

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
      "description": "Высокий рейтинг продавца: с тобой имеют дело охотно и спокойно.",
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
        }
      ]
    }
  ]
}
```

#### `achievements_progress`

Каждый верхнеуровневый элемент связан с достижением по `code`. Тот же `code` повторяется во
вложенных узлах.

| Поле          | Тип                       | Описание                           |
| ------------- | ------------------------- | ---------------------------------- |
| `code`        | `string`                  | Код достижения                     |
| `type`        | `condition \| all \| any` | Тип правила                        |
| `is_complete` | `boolean`                 | Выполнено ли правило               |
| `progress`    | `number`                  | Процент от 0 до 100                |
| `condition`   | `object`, optional        | Листовое условие                   |
| `children`    | `array`, optional         | Дочерние правила для `all` / `any` |

`condition.current` и `condition.target` передаются строками. Прогресс вычисляет backend;
frontend не пересчитывает его самостоятельно.

### `GET /api/users/{userId}/stats`

Ответ является публичной проекцией `YearMetrics`. В отличие от внутреннего объекта он не
содержит `YearAchievements` и обогащённые названия/изображения внутри вспомогательных
массивов.

```json
{
  "userId": 910001,
  "registrationDate": "2018-04-12T09:00:00Z",
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
  "yearsOnAvito": 8,
  "priceMin": 500,
  "priceMax": 150000,
  "sellerRating": 4.9,
  "favoriteBuyCategory": {
    "id": 1,
    "name": "Электроника"
  },
  "favoriteSellCategory": null,
  "mostViewedListing": {
    "id": 2,
    "name": "iPhone 13 128GB",
    "city": "Москва",
    "imageUrl": "/static/listings/iphone.jpg",
    "viewsCount": 42
  },
  "bestReviewReceived": null,
  "bestReviewLeft": null,
  "viewsByCategory": [
    {
      "categoryId": 1,
      "categoryName": "Электроника",
      "views": 400
    }
  ],
  "searchesByCategory": [
    {
      "categoryId": 1,
      "categoryName": "Электроника",
      "searches": 80
    }
  ],
  "favorites": [
    {
      "listingId": 2,
      "categoryId": 1
    }
  ],
  "listingViewCounts": [
    {
      "listingId": 2,
      "categoryId": 1,
      "views": 42
    }
  ],
  "messagedListingIds": [9],
  "ownListings": [
    {
      "id": 11,
      "categoryId": 3,
      "status": "active",
      "updatedAt": "2026-07-01T12:00:00Z",
      "viewsCount": 3
    }
  ]
}
```

Поля сумм, диапазона цен, рейтинга, категорий, объявления и отзывов могут быть `null`.

### `GET /api/users/{userId}/prediction`

Возвращает развлекательное, а не аналитическое или ML-предсказание на `RECAP_YEAR + 1`.
Пользовательские метрики во внешний AI-запрос не передаются.

```json
{
  "userId": 910001,
  "year": 2027,
  "title": "Твоё предсказание на 2027",
  "text": "В следующем году тебя ждёт неожиданно выгодная находка. Главное — не пролистать её мимо.",
  "type": "fortune"
}
```

Если внешний AI API не настроен, вернул ошибку или недопустимый текст, backend использует
локальный fallback в том же формате.

## Ошибки

Ошибки обработанных API-маршрутов имеют единый формат:

```json
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

| HTTP  | Коды, встречающиеся сейчас                                               | Смысл                                             |
| ----- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| `400` | `VALIDATION_ERROR`                                                       | Невалидный path-параметр или JSON body            |
| `404` | `USER_NOT_FOUND`, `RECAP_NOT_FOUND`, `SHARE_NOT_FOUND`                   | Пользователь, recap или share не найдены          |
| `404` | `USER_STATS_NOT_FOUND`, `ACHIEVEMENTS_NOT_FOUND`, `ACHIEVEMENTS_TO_USER` | Ошибка данных при обновлении достижений           |
| `500` | `INTERNAL_ERROR`                                                         | Внутренняя ошибка; детали клиенту не раскрываются |

Обёртка API умеет отображать `409 CONFLICT`, но текущие сервисы этот статус намеренно не
возвращают. Неизвестные маршруты и неподдерживаемые методы обрабатывает Chi стандартным
ответом `404`/`405`; для них JSON-обёртка не гарантируется.
