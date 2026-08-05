import { useState } from 'react';
import type { Recap } from '../../entities/recap/types';
import { mockRecap } from '../../mocks/mockRecap';
import styles from './GenerateRecapButton.module.css';

type GenerateRecapButtonProps = {
  onGenerated: (recap: Recap) => void;
};
// заглушка просто
const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });


export function GenerateRecapButton({
  onGenerated,
}: GenerateRecapButtonProps) {
  /*
   * состояние загрузки:
   *
   * isLoading — текущее значение.
   * setIsLoading — функция изменения значения.
   * false — начальное значение.
   */
  const [isLoading, setIsLoading] =
    useState(false);

  const handleClick = async () => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);

    try {
      await wait(1500);
      onGenerated(mockRecap);
    } finally {
      setIsLoading(false);// тут ошибки надо перекинуть дальше
    }
  };
  return (
    <button
      className={styles.button}
      type="button"
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading && (
        <span
          className={styles.spinner}
          aria-hidden="true"
        />
      )}

      {isLoading
        ? 'Генерируем итоги...' //можно придумать прикольные загрузки
        : 'Посмотреть итоги года'}
    </button>
  );
}