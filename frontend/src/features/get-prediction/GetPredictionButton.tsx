import type { Prediction } from '../../entities/prediction/types';
import { AsyncActionButton } from '../../shared/ui/AsyncActionButton/AsyncActionButton';

import { useGetPrediction } from './model/useGetPrediction';

type GetPredictionButtonProps = {
  userId: number;
  nextYear: number;
  onReceived: (prediction: Prediction) => void;
};

export function GetPredictionButton({
  userId,
  nextYear,
  onReceived,
}: GetPredictionButtonProps) {
  const { getPrediction, isGetting, errorMessage } = useGetPrediction({
    userId,
    onReceived,
  });

  return (
    <AsyncActionButton
      label={`Предсказание на ${nextYear} год`}
      loadingLabel="Заглядываем в будущее…"
      isLoading={isGetting}
      errorMessage={errorMessage}
      onClick={getPrediction}
      variant="secondary"
    />
  );
}
