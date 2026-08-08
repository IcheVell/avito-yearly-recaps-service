# Frontend

Клиентская часть Avito Yearly Recaps построена на React, TypeScript, Redux Toolkit и Vite. Для тестирования используются Vitest, React Testing Library и jsdom.

## Требования

- Node.js `20.19+` или `22.12+`;
- npm;
- доступ в интернет для установки зависимостей и загрузки внешних изображений из моков.

Проверить установленные версии:

```bash
node --version
npm --version
```

## Установка зависимостей

Из корня репозитория:

```bash
cd frontend
npm ci
```

## Запуск на моках

Создайте файл `frontend/.env.local`:

```dotenv
VITE_USE_MOCKS=true
```

Запустите dev-сервер:

```bash
npm run dev
```

Vite выведет адрес приложения в терминале, обычно это <http://localhost:5173>.

В режиме моков backend и PostgreSQL не требуются. В `src/mocks` подготовлены данные для девяти тестовых профилей со статистикой, достижениями.

## Запуск с API

Сначала запустите backend на `http://localhost:8081`. Например, из корня репозитория:

```bash
docker compose up --build
```

Укажите в `frontend/.env.local`:

```dotenv
VITE_USE_MOCKS=false
VITE_API_BASE_URL=/api
```

После изменения переменных окружения перезапустите Vite:

```bash
npm run dev
```

Если `VITE_API_BASE_URL` не задан, используется `/api`. Dev-сервер Vite проксирует запросы `/api` и `/static` на `http://localhost:8081` .

`VITE_USE_MOCKS` включает локальные данные только при точном значении `true`.

## Команды

Все команды выполняются из папки `frontend`.

Запуск dev-сервера:

```bash
npm run dev
```

Однократный запуск тестов:

```bash
npm test
```

Запуск тестов в watch-режиме:

```bash
npm run test:watch
```

Проверка ESLint:

```bash
npm run lint
```

Проверка TypeScript и production-сборка:

```bash
npm run build
```

Локальный просмотр production-сборки:

```bash
npm run preview
```

## Тесты

Тесты находятся в папке `frontend/tests` :

```text
tests/
├── features/
├── pages/
├── shared/
└── widgets/
```

Покрыты основные пользовательские сценарии:

- получение и генерация итогов;
- смена профиля и защита от запоздавших ответов;
- загрузка статистики и достижений;
- ошибки API и повторные запросы;
- `null` и пустые данные;
- навигация по итоговым карточкам с помощью кнопок и клавиатуры.

