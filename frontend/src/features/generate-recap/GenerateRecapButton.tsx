import type { Recap } from '../../entities/recap/types';
import { getApiErrorMessage } from '../../shared/api/apiError';
import { useGenerateRecapMutation } from '../../shared/api/recapApi';

import styles from './GenerateRecapButton.module.css';

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
  const [
    generateRecap,
    { isLoading, error, reset },
  ] = useGenerateRecapMutation();


  const handleClick = async () => {
    reset(); 
    try{
      const recap = await generateRecap({ userId, year }).unwrap();
      onGenerated(recap);
    } 
    catch {
       // Ошибка уже находится в переменной error и показывается ниже.
    }
  }

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.button}
        type="button"
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading && (
          <span className={styles.spinner} aria-hidden="true" />
        )}

        {isLoading
          ? 'Генерируем итоги…'
          : 'Посмотреть итоги года'}
      </button>

      {error && (
        <p className={styles.error} role="alert">
          {getApiErrorMessage(error)}
        </p>
      )}
    </div>
  );
}