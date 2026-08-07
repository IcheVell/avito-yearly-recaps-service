import { CloseRecapButton } from '../../features/close-recap/CloseRecapButton';

import type { RecapSlide } from './model/recapSlides';
import styles from './RecapOverlay.module.css';

type RecapProgressProps = {
  slides: RecapSlide[];
  currentSlide: number;
  onSelectSlide: (index: number) => void;
  onClose: () => void;
};

export function RecapProgress({
  slides,
  currentSlide,
  onSelectSlide,
  onClose,
}: RecapProgressProps) {
  return (
    <header className={styles.topBar}>
      <div
        className={styles.progress}
        aria-label={`Карточка ${currentSlide + 1} из ${slides.length}`}
      >
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            className={`${styles.progressItem} ${
              index === currentSlide ? styles.progressItemActive : ''
            }`}
            type="button"
            onClick={() => onSelectSlide(index)}
            aria-label={`Перейти к карточке ${index + 1}`}
          />
        ))}
      </div>

      <CloseRecapButton onClose={onClose} />
    </header>
  );
}
