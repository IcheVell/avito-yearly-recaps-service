import type { Recap } from '../../entities/recap/types';

import styles from './GenerateRecapButton.module.css';
import { useGenerateRecap } from './model/useGenerateRecap';

type GenerateRecapButtonProps = {
  userId: number;
  onGenerated: (recap: Recap) => void;
};

export function GenerateRecapButton({
  userId,
  onGenerated,
}: GenerateRecapButtonProps) {
  const {
    generateRecap,
    isGenerating,
    errorMessage,
  } = useGenerateRecap({
    userId,
    onGenerated,
  });

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.button}
        type="button"
        onClick={generateRecap}
        disabled={isGenerating}
      >
        {isGenerating && (
          <span className={styles.spinner} aria-hidden="true" />
        )}

        {isGenerating
          ? 'Генерируем итоги…'
          : 'Посмотреть итоги года'}
      </button>

      {errorMessage && (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
