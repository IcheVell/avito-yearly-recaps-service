import { useCallback, useState } from 'react';

import type { Prediction } from '../../../entities/prediction/types';
import { getApiErrorMessage } from '../../../shared/api/apiError';
import { useLazyGetPredictionQuery } from '../../../shared/api/predictionApi';

type UseGetPredictionOptions = {
  userId: number;
  onReceived: (prediction: Prediction) => void;
  onError?: (message: string) => void;
};

type UseGetPredictionResult = {
  getPrediction: () => Promise<void>;
  isGetting: boolean;
  errorMessage: string | null;
};

export function useGetPrediction({
  userId,
  onReceived,
  onError,
}: UseGetPredictionOptions): UseGetPredictionResult {
  const [triggerGetPrediction, { isFetching, error }] =
    useLazyGetPredictionQuery();
  const [localError, setLocalError] = useState<string | null>(null);

  const getPrediction = useCallback(async () => {
    setLocalError(null);

    try {
      const prediction = await triggerGetPrediction(userId).unwrap();
      onReceived(prediction);
    } catch (requestError) {
      const message = getApiErrorMessage(requestError);
      setLocalError(message);
      onError?.(message);
    }
  }, [onError, onReceived, triggerGetPrediction, userId]);

  return {
    getPrediction,
    isGetting: isFetching,
    errorMessage: localError ?? (error ? getApiErrorMessage(error) : null),
  };
}
