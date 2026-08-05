## Требования

- Node.js `20.19+` или `22.12+`;
- npm;
- доступ в интернет для загрузки внешних изображений из моков.

Проверить версии:

```bash
node --version
npm --version
```

## Быстрый запуск на моках

Из корня репозитория перейдите в папку frontend и установите зависимости:

```bash
cd frontend
npm ci
```

Создайте файл `frontend/.env.local`:

```dotenv
VITE_USE_MOCKS=true
```

Запустите dev-сервер:

```bash
npm run dev
```

Vite выведет адрес приложения в терминале, обычно это <http://localhost:5173>.

В режиме моков backend и база данных не требуются. Для трёх тестовых профилей используются разные наборы recap-карточек из `src/mocks`.

## Запуск с API

Переменные окружения frontend:

```dotenv
VITE_USE_MOCKS=false
VITE_API_BASE_URL=/api
```

`VITE_USE_MOCKS` включает локальные данные только при точном значении `true`. Если `VITE_API_BASE_URL` не указан, используется `/api`.

## Полезные команды

Все команды выполняются из папки `frontend`:

```bash
# Dev-сервер с hot reload
npm run dev

# Проверка ESLint
npm run lint

# TypeScript-проверка 
npm run build
```
