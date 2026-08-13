import { useCallback } from 'react';

import type { Prediction } from '../../../entities/prediction/types';
import { getApiErrorMessage } from '../../../shared/api/apiError';
import { useLazyGetPredictionQuery } from '../../../shared/api/predictionApi';

type UseGetPredictionOptions = {
  userId: number;
  onReceived: (prediction: Prediction) => void;
};

type UseGetPredictionResult = {
  getPrediction: () => Promise<void>;
  isGetting: boolean;
  errorMessage: string | null;
};

export function useGetPrediction({
  userId,
  onReceived,
}: UseGetPredictionOptions): UseGetPredictionResult {
  const [triggerGetPrediction, { isFetching, error }] =
    useLazyGetPredictionQuery();

  const getPrediction = useCallback(async () => {
    try {
      const prediction = await triggerGetPrediction(userId).unwrap();
      onReceived(prediction);
    } catch {
      return;
    }
  }, [onReceived, triggerGetPrediction, userId]);

  return {
    getPrediction,
    isGetting: isFetching,
    errorMessage: error ? getApiErrorMessage(error) : null,
  };
}
