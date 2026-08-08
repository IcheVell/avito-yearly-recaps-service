import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
 // 
//  Из видео:
//  ожидаемое поведение, а не как техническое действие.
// Что конкретно проверяет тест?
// Что должно изменится в коде , чтобы тест сломался?
// 1.получение итогов:
// запрос с верным ID, ответ открывает карточки, RECAP_NOT_FOUND,  открытие плашки с ошибкой, исзчезание плашки
// 2. смена профиля:
// проверка такого же но со сменной профиля
// 3. ответы на null, сервер вернул коды 400, 404, 500, 502, 503, 504, 505, 511
// 4. карточки формируеются в верном порядке ( проверка индекса), нельзя пеерйти левее/правее.

// it('показывает ошибку', async () => {
//   // Arrange — подготовка
//   const user = userEvent.setup();
//   render(<Component />);

//   // Act — действие
//   await user.click(screen.getByRole('button'));

//   // Assert — проверка
//   expect(screen.getByRole('alert')).toBeInTheDocument();
// });