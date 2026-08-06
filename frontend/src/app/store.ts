import { configureStore } from '@reduxjs/toolkit';

import { baseApi } from '../shared/api/baseApi';

/**
 * Общее Redux-хранилище приложения.
 *
 * Отдельный recapSlice пока не нужен:
 * RTK Query сам хранит server state, cache, loading и errors.
 */
export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
  },

  /**
   * Middleware RTK Query запускает запросы,
   * управляет cache и повторным получением данных.
   */
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
