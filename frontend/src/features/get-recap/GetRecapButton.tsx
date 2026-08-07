import type { Recap } from '../../entities/recap/types';
import { AsyncActionButton } from '../../shared/ui/AsyncActionButton/AsyncActionButton';

import { useGetRecap } from './model/useGetRecap';

type GetRecapButtonProps = {
  userId: number;
  onReceived: (recap: Recap) => void;
};

export function GetRecapButton({
  userId,
  onReceived,
}: GetRecapButtonProps) {
  const { getRecap, isGetting, errorMessage } = useGetRecap({
    userId,
    onReceived,
  });

  return (
    <AsyncActionButton
      label="Посмотреть итоги года"
      loadingLabel="Загружаем итоги…"
      isLoading={isGetting}
      errorMessage={errorMessage}
      onClick={getRecap}
      variant="secondary"
    />
  );
}
