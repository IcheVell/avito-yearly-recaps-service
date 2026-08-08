import styles from './RecapOverlay.module.css';

type RecapControlsProps = {
  currentSlide: number;
  slidesCount: number;
  isFirstSlide: boolean;
  isLastSlide: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function RecapControls({
  currentSlide,
  slidesCount,
  isFirstSlide,
  isLastSlide,
  onPrevious,
  onNext,
}: RecapControlsProps) {
  return (
    <footer className={styles.controls}>
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirstSlide}
        aria-label="Предыдущая карточка"
      >
        <span className={styles.controlIcon} aria-hidden="true">
          ←
        </span>
        <span className={styles.controlLabel}>Назад</span>
      </button>

      <span>
        {currentSlide + 1} / {slidesCount}
      </span>

      <button
        type="button"
        onClick={onNext}
        disabled={isLastSlide}
        aria-label="Следующая карточка"
      >
        <span className={styles.controlIcon} aria-hidden="true">
          →
        </span>
        <span className={styles.controlLabel}>Вперёд</span>
      </button>
    </footer>
  );
}
