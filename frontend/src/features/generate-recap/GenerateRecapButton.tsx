import type { Recap } from '../../entities/recap/types';
import { AsyncActionButton } from '../../shared/ui/AsyncActionButton/AsyncActionButton';

import { useGenerateRecap } from './model/useGenerateRecap';

type GenerateRecapButtonProps = {
  userId: number;
  year: number;
  onGenerated: (recap: Recap) => void;
};

export function GenerateRecapButton({
  userId,
  year,
  onGenerated,
}: GenerateRecapButtonProps) {
  const { generateRecap, isGenerating, errorMessage } = useGenerateRecap({
    userId,
    onGenerated,
  });

  return (
    <AsyncActionButton
      label={`Сгенерировать итоги за ${year} год`}
      loadingLabel="Генерируем итоги…"
      isLoading={isGenerating}
      errorMessage={errorMessage}
      onClick={generateRecap}
    />
  );
}
