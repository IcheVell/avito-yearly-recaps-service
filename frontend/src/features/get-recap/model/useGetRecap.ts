import { useCallback } from 'react';

import type { Recap } from '../../../entities/recap/types';
import { getApiErrorMessage } from '../../../shared/api/apiError';
import { useLazyGetRecapQuery } from '../../../shared/api/recapApi';

type UseGetRecapOptions = {
  userId: number;
  onReceived: (recap: Recap) => void;
};

type UseGetRecapResult = {
  getRecap: () => Promise<void>;
  isGetting: boolean;
  errorMessage: string | null;
};

export function useGetRecap({
  userId,
  onReceived,
}: UseGetRecapOptions): UseGetRecapResult {
  const [triggerGetRecap, { isFetching, error }] =
    useLazyGetRecapQuery();

  const getRecap = useCallback(async () => {
    try {
      const recap = await triggerGetRecap(userId).unwrap();
      onReceived(recap);
    } catch {
      // RTK Query сохраняет ошибку запроса в `error`.
    }
  }, [onReceived, triggerGetRecap, userId]);

  return {
    getRecap,
    isGetting: isFetching,
    errorMessage:
      !isFetching && error ? getApiErrorMessage(error) : null,
  };
}
