# Git-правила проекта `avito-yearly-recaps-service`

## Формат коммитов

```text
<type>: <краткое описание>
```

Примеры:

```text
feat: add yearly recap generation
fix: fix active days calculation
docs: update database schema
```

Сообщения коммитов пишутся на английском языке, в повелительной форме и без точки в конце.

---

## Виды коммитов

### `feat`

Добавление новой функциональности.

```text
feat: add favorite listings
feat: implement user role calculation
feat: add yearly recap endpoint
```

### `fix`

Исправление ошибки.

```text
fix: fix duplicate favorites
fix: fix yearly activity filtering
```

### `docs`

Изменение документации.

```text
docs: update API documentation
docs: improve README
```

### `refactor`

Переработка кода без изменения его поведения.

```text
refactor: separate recap service layer
refactor: simplify activity calculation
```

### `test`

Добавление или изменение тестов.

```text
test: add recap service tests
test: add favorite repository tests
```

### `style`

Форматирование кода без изменения логики.

```text
style: format Go files
style: reorder imports
```

### `chore`

Настройка проекта, зависимостей и инфраструктуры.

```text
chore: configure Docker Compose
chore: update frontend dependencies
```

---

## Правила коммитов

- Один коммит должен содержать одно логическое изменение.
- Нельзя использовать сообщения `fix`, `update`, `changes`, `work`, `final`.
- Нельзя объединять разные задачи в одном коммите.
- Нельзя добавлять `.env`, пароли, токены и другие секреты.
- Перед коммитом код должен быть отформатирован и не содержать ошибок линтера.

---

## Названия веток

Формат:

```text
<type>/AYRS-<номер>-<описание>
```

Примеры:

```text
feat/AYRS-15-recap-generation
feat/AYRS-23-favorite-analytics
fix/AYRS-31-active-days-calculation
docs/AYRS-5-api-documentation
refactor/AYRS-36-recap-service
chore/AYRS-7-docker-configuration
```

Тип ветки совпадает с типом коммита: `feat`, `fix`, `docs`, `refactor`, `test` или `chore`.
В описании используются английские слова в нижнем регистре, разделённые дефисами.

---

## Работа с основными ветками

- `develop` — текущая интеграционная ветка проекта; обычные Pull Request направляются в неё.
- `master` используется как стабильная ветка и обновляется через согласованный Pull Request из `develop`.
- Прямой push в `develop` и `master` запрещён.
- Изменения добавляются только через отдельную ветку и Pull Request.
- Перед созданием Pull Request необходимо обновить свою ветку относительно `develop`.
- Pull Request должен содержать изменения только одной задачи.
- Нельзя выполнять `force push` в общие ветки без согласования.
- После слияния Pull Request рабочую ветку следует удалить.

---

## Перед созданием Pull Request

Необходимо проверить, что:

- проект собирается;
- приложение запускается через Docker Compose;
- тесты проходят;
- линтер не выдаёт ошибок;
- миграции применяются без ошибок;
- в коммитах нет секретов и временных файлов;
- README и API-документация обновлены, если это необходимо.

Минимальные проверки backend:

```bash
cd backend
go test ./...
```

Минимальные проверки frontend:

```bash
cd frontend
npm run format:check
npm test
npm run lint
npm run build
```
