# Каталог ролей, метрик, достижений и действий

Коды `code` / `type` должны совпадать с API.  
Тексты на бэке могут рандомиться — ниже `name` / `title` / `label` как стабильные ориентиры UI.

Полный HTTP-контракт: [`CONTRACTS.md`](./CONTRACTS.md).

---

## Роли (`Recap.role`)

| code      | name        | subtitle (шаблон)             | why (шаблон)                                              |
| --------- | ----------- | ----------------------------- | --------------------------------------------------------- |
| `seller`  | Продавец    | Ты продал `%d` товаров.       | `%d%%` активности — создание объявлений и продажа товаров |
| `buyer`   | Покупатель  | Ты купил `%d` товаров.        | `%d%%` активности — поиск и покупки                       |
| `watcher` | Наблюдатель | Ты посмотрел `%d` объявлений. | `%d%%` активности — просмотры и поиск                     |

Поля в API: `code`, `name`, `title`, `subtitle`, `why`, `activitySharePercent`.

Примеры `title`:

- **seller:** «В этом году ты крутой продавец!», «В этом году ты был на волне продаж!»
- **buyer:** «В этом году ты активный покупатель!», «Ого! Да ты скупил половину Авито в этом году!»
- **watcher:** «В этом году ты внимательный наблюдатель!»

---

## Метрики (`Recap.metrics[]`)

### Как выбираются

- до **2** `number`
- до **1** `qualitative`
- до **1** `comparison`
- среди **доступных** по данным пользователя (рандом)

Поля элемента: `type`, `title`, `text`, `highlights[]`, `payload`.

### Number

| type                       | title                    | payload                        |
| -------------------------- | ------------------------ | ------------------------------ |
| `earned_amount`            | Заработанная сумма       | `earnedAmount: number`         |
| `spent_amount`             | Потраченная сумма        | `spentAmount: number`          |
| `max_streak_days`          | Серия активности         | `maxStreakDays: number`        |
| `active_days_number`       | Дни на Avito             | `activeDays: number`           |
| `viewed_listenings_number` | Просмотренные объявления | `viewsCount: number`           |
| `chats_people`             | Начатых диалогов за год  | `peopleCount: number`          |
| `years_together`           | Лет вместе с Avito       | `yearsTogether: number`        |
| `seller_rating`            | Рейтинг продавца         | `sellerRating: number`         |
| `sells_count`              | Продажи за год           | `sellsCount: number`           |
| `buys_count`               | Покупки за год           | `buysCount: number`            |
| `listings_created`         | Новые объявления         | `listingsCreatedCount: number` |
| `favorites_count`          | Избранное                | `favoritesCount: number`       |
| `searches_count`           | Поиски                   | `searchesCount: number`        |

### Qualitative

| type                     | title                              | payload                                               |
| ------------------------ | ---------------------------------- | ----------------------------------------------------- |
| `favorite_buy_category`  | Любимая категория покупок          | `categoryId`, `categoryName`                          |
| `favorite_sell_category` | Любимая категория продаж           | `categoryId`, `categoryName`                          |
| `best_received_review`   | Лучший полученный отзыв            | `bestReceivedReview: string`                          |
| `best_left_review`       | Лучший оставленный отзыв           | `bestLeftReview: string`                              |
| `most_viewed_listing`    | Объявление, к которому возвращался | `listingId`, `name`, `city`, `imageUrl`, `viewsCount` |
| `price_range`            | Диапазон цен                       | `priceMin`, `priceMax`                                |

### Comparison

| type                      | title                 | payload                                                                            |
| ------------------------- | --------------------- | ---------------------------------------------------------------------------------- |
| `buy_category_comparison` | Сравнение интересов   | `leftCategoryName`, `leftCategoryCount`, `rightCategoryName`, `rightCategoryCount` |
| `buy_vs_sell`             | Покупки vs продажи    | `buysCount`, `sellsCount`                                                          |
| `views_vs_favorites`      | Просмотры и избранное | `viewsCount`, `favoritesCount`                                                     |

---

## Ачивки

### Каталог (все возможные)

| code                | name                | description                                                            |
| ------------------- | ------------------- | ---------------------------------------------------------------------- |
| `streak_survivor`   | Несгибаемый         | Были дни, когда Avito тебя не отпускал — серия без пропусков.          |
| `two_faced_market`  | Две стороны рынка   | За год ты успел и купить, и продать — побывал по обе стороны сделки.   |
| `shortlist_boarder` | Коллекционер        | Избранное разрослось: ты собирал варианты, прежде чем выбрать.         |
| `wallet_whisperer`  | Шёпот кошелька      | Покупки года сложились в заметную сумму — любопытство явно не дремало. |
| `trust_badge`       | Знак доверия        | Высокий рейтинг продавца: с тобой имеют дело охотно и спокойно.        |
| `diplomat`          | Дипломат            | Кажется ты перепутал Avito с мессенджером.                             |
| `plot_twist`        | Неожиданный поворот | После паузы ты вернулся на площадку — сюжет года сделал виток.         |

### Где встречаются в API

**В Recap** (`generate` / `GET …/recap`) — `achievements[]`, **0…3** за активный год:

```ts
{
  (code, name, description, imageUrl);
}
```

**Каталог пользователя** — `GET /api/users/{userId}/achievements`:

```ts
{
  earned: [{ code, name, description, earnedAt, imageUrl }],
  locked: [{ code, name, description, imageUrl }],
  achievements_progress: [
    {
      code,
      type,        // condition | all | any
      is_complete,
      progress,    // 0…100
      condition?,
      children?
    }
  ]
}
```

- `earned` содержит достижения за все годы и сортируется от новых к старым;
- `locked` содержит ещё не полученные достижения;
- `achievements_progress` содержит рассчитанное backend дерево прогресса;
- достижение и его дерево прогресса связываются по `code`, а не по индексу массива.

Frontend не рассчитывает прогресс самостоятельно. Полная структура дерева правил описана в
[`CONTRACTS.md`](./CONTRACTS.md#achievements_progress).

---

## Действия / CTA (`Recap.action`)

Ровно **одно** действие.

| type                | label                   | reason                                                                      | target                                                             |
| ------------------- | ----------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `boost_listings`    | Обновить объявления     | Часть твоих объявлений потеряла отклик — стоит поднять их снова.            | устаревшие активные объявления в `listingIds[]` и `listings[]`     |
| `create_listing`    | Разместить новое        | У тебя уже были успешные продажи — самое время разместить новое объявление. | без категории и объявлений                                         |
| `listing_abandoned` | Написать продавцу       | Есть объявление, которым ты сильно интересовался, но так и не написал.      | одно объявление, `categoryId`, `categoryName`, `listings[1]`       |
| `compare_top`       | Сравнить топ-3          | У тебя уже есть хорошие кандидаты, сравни их и выбери лучший вариант.       | три объявления одной категории в `listingIds[]` и `listings[]`     |
| `open_favorites`    | Вернуться к сохранённым | У тебя есть избранные объявления, к которым ты давно не возвращался.        | наиболее частая категория избранного: `categoryId`, `categoryName` |
| `continue_search`   | Продолжить поиск        | Ты активно смотрел и искал, но можно сузить выбор и дойти до результата.    | наиболее просматриваемая или искомая категория; fallback           |

### Структура действия

```ts
type RecapAction = {
  type: string;
  label: string;
  reason: string;
  target: {
    listingIds: number[];
    categoryId: number;
    categoryName?: string;
    listings: ActionListingPreview[];
  };
};
```

Backend нормализует отсутствующие `listingIds` и `listings` в пустые массивы. Если действие не
связано с категорией, `categoryId` равен `0`, а пустой `categoryName` не включается в JSON.

### Превью объявления (`target.listings[]`)

```ts
type ActionListingPreview = {
  id: number;
  name?: string;
  imageUrl?: string;
  price: number | null;
  city?: string;
  status?: string;
  categoryId?: number;
  categoryName?: string;
  viewsCount?: number;
  updatedAt?: string;
};
```

`listings[]` — обогащённое представление объектов из `listingIds[]` для UI. Backend собирает его
из годовых метрик пользователя, чтобы frontend мог показать модальное окно действия без
дополнительного запроса объявлений. Неизвестные необязательные поля могут отсутствовать.
`price` присутствует всегда и при неизвестной цене равен `null`; `updatedAt` при отсутствии
значения не включается в JSON.

### Как выбирается CTA

Backend сначала определяет доступные сценарии по данным пользователя, затем сравнивает их
оценки. Учитываются устаревшие объявления, успешные продажи, просмотры без диалога,
избранное и поисковая активность. Если более конкретный сценарий не подходит, используется
`continue_search`.

---

## Публичная share-карточка

Публичная версия создаётся из уже сохранённого recap и намеренно содержит меньше данных:

- из роли передаются только `code`, `name` и `title`;
- из метрик — `type`, `title`, `text` и `highlights[]`, без `payload`;
- из достижений — `code`, `name` и `imageUrl`, без `description`;
- `userId`, `createdAt`, `action` и `debug` не публикуются.

Создание и получение share-карточки описаны в
[`CONTRACTS.md`](./CONTRACTS.md#публичная-share-карточка).

---

## Источники на бэке

| Сущность                                 | Файл                                               |
| ---------------------------------------- | -------------------------------------------------- |
| Роли                                     | `backend/catalog/roles.json`                       |
| Метрики                                  | `backend/catalog/metrics.json`                     |
| Действия                                 | `backend/catalog/actions.json`                     |
| Ачивки (сид)                             | `backend/migrations/000002_seed.up.sql`            |
| Правила выбора CTA и заполнение `target` | `backend/internal/engine/action.go`                |
| HTTP DTO действия                        | `backend/internal/api/dto/recap.go`                |
| Вычисление прогресса ачивок              | `backend/internal/engine/rules/evaluate.go`        |
| Формирование публичной share-карточки    | `backend/internal/engine/share_recap_generator.go` |
