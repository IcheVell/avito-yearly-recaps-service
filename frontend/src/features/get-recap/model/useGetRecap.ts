import { useCallback } from 'react';

import type { Recap } from '../../../entities/recap/types';
import { getApiErrorMessage } from '../../../shared/api/apiError';
import { useLazyGetRecapQuery } from '../../../shared/api/recapApi';

type UseGetRecapOptions = {
  userId: number;
  onReceived: (recap: Recap) => void;
  onError: (message: string) => void;
};

type UseGetRecapResult = {
  getRecap: () => Promise<void>;
  isGetting: boolean;
};

export function useGetRecap({
  userId,
  onReceived,
  onError,
}: UseGetRecapOptions): UseGetRecapResult {
  const [triggerGetRecap, { isFetching }] = useLazyGetRecapQuery();

  const getRecap = useCallback(async () => {
    try {
      const recap = await triggerGetRecap(userId).unwrap();
      onReceived(recap);
    } catch (error) {
      onError(getApiErrorMessage(error));
    }
  }, [onError, onReceived, triggerGetRecap, userId]);

  return {
    getRecap,
    isGetting: isFetching,
  };
}
