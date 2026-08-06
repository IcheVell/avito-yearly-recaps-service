import type { PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { store } from './store';

/**
 * Здесь собираются глобальные providers приложения.
 * Сейчас это Redux Provider; позже сюда можно добавить Router или Theme.
 */
export function AppProviders({ children }: PropsWithChildren) {
  return <Provider store={store}>{children}</Provider>;
}
