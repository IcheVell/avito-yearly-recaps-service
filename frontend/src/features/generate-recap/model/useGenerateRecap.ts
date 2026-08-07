import { useCallback } from 'react';

import type { Recap } from '../../../entities/recap/types';
import { getApiErrorMessage } from '../../../shared/api/apiError';
import { useGenerateRecapMutation } from '../../../shared/api/recapApi';

type UseGenerateRecapOptions = {
  userId: number;
  year: number;
  onGenerated: (recap: Recap) => void;
};

type UseGenerateRecapResult = {
  generateRecap: () => Promise<void>;
  isGenerating: boolean;
  errorMessage: string | null;
};

export function useGenerateRecap({
  userId,
  year,
  onGenerated,
}: UseGenerateRecapOptions): UseGenerateRecapResult {
  const [triggerGenerateRecap, { isLoading, error, reset }] =
    useGenerateRecapMutation();

  const generateRecap = useCallback(async () => {
    reset();

    try {
      const recap = await triggerGenerateRecap({
        userId,
        year,
      }).unwrap();

      onGenerated(recap);
    } catch {
      // RTK Query сохраняет ошибку mutation в `error`.
    }
  }, [onGenerated, reset, triggerGenerateRecap, userId, year]);

  return {
    generateRecap,
    isGenerating: isLoading,
    errorMessage: error ? getApiErrorMessage(error) : null,
  };
}
