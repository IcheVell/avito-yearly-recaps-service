import {
  useEffect,
  useMemo,
} from 'react';

import { createCardVariants } from '../../entities/recap/createCardVariants';
import type {
  Recap,
  RecapAction,
} from '../../entities/recap/types';
import { CloseRecapButton } from '../../features/close-recap/CloseRecapButton';

import { createRecapSlides } from './model/recapSlides';
import { useRecapCarousel } from './model/useRecapCarousel';
import styles from './RecapOverlay.module.css';
import { RecapSlideView } from './RecapSlideView';

type RecapOverlayProps = {
  recap: Recap;
  onClose: () => void;
};

const FIREWORK_PARTICLES = Array.from({ length: 12 });

function OverlayFirework({ className }: { className: string }) {
  return (
    <span className={`${styles.overlayFirework} ${className}`}>
      {FIREWORK_PARTICLES.map((_, index) => (
        <i key={index} />
      ))}
    </span>
  );
}

export function RecapOverlay({
  recap,
  onClose,
}: RecapOverlayProps) {
  const slides = useMemo(
    () => createRecapSlides(recap),
    [recap],
  );
  const slidesCount = slides.length;

  const {
    trackRef,
    currentSlide,
    scrollToSlide,
    goToPreviousSlide,
    goToNextSlide,
    handleTrackScroll,
    isFirstSlide,
    isLastSlide,
  } = useRecapCarousel(slidesCount);

  const variants = useMemo(
    () =>
      createCardVariants(
        `${recap.id}-${recap.createdAt}`,
        slidesCount,
      ),
    [recap.id, recap.createdAt, slidesCount],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPreviousSlide();
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToNextSlide();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToNextSlide, goToPreviousSlide, onClose]);

  function handleAction(action: RecapAction) {
    switch (action.type) {
      case 'boost_listings':
        console.info('Boost listings:', {
          listingIds: action.target.listingIds,
          categoryId: action.target.categoryId,
        });
        return;

      case 'view_favorites':
        console.info('View favorites:', {
          listingIds: action.target.listingIds,
          categoryId: action.target.categoryId,
        });
        return;

      case 'open_recommendations':
        console.info('Open recommendations:', {
          categoryId: action.target.categoryId,
        });
        return;

      default: {
        const exhaustiveAction: never = action;
        throw new Error(
          `Неизвестное recap-действие: ${JSON.stringify(
            exhaustiveAction,
          )}`,
        );
      }
    }
  }

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`Итоги ${recap.year} года`}
    >
      <header className={styles.topBar}>
        <div
          className={styles.progress}
          aria-label={`Карточка ${
            currentSlide + 1
          } из ${slidesCount}`}
        >
          {slides.map(
            (slide, index) => (
              <button
                key={slide.id}
                className={`${
                  styles.progressItem
                } ${
                  index === currentSlide
                    ? styles.progressItemActive
                    : ''
                }`}
                type="button"
                onClick={() => scrollToSlide(index)}
                aria-label={`Перейти к карточке ${
                  index + 1
                }`}
              />
            ),
          )}
        </div>

        <CloseRecapButton onClose={onClose} />
      </header>

      {slides[currentSlide]?.kind === 'intro' && (
        <div className={styles.fireworksLayer} aria-hidden="true">
          <OverlayFirework className={styles.fireworkUpperLeft} />
          <OverlayFirework className={styles.fireworkUpperRight} />
          <OverlayFirework className={styles.fireworkLowerLeft} />
          <OverlayFirework className={styles.fireworkLowerRight} />
        </div>
      )}

      <div
        ref={trackRef}
        className={styles.track}
        onScroll={handleTrackScroll}
      >
        {slides.map((slide, index) => (
          <RecapSlideView
            key={slide.id}
            slide={slide}
            variant={variants[index]}
            isActive={currentSlide === index}
            onAction={handleAction}
          />
        ))}
      </div>

      <footer className={styles.controls}>
        <button
          type="button"
          onClick={goToPreviousSlide}
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
          onClick={goToNextSlide}
          disabled={isLastSlide}
          aria-label="Следующая карточка"
        >
          <span className={styles.controlIcon} aria-hidden="true">
            →
          </span>
          <span className={styles.controlLabel}>Вперёд</span>
        </button>
      </footer>
    </div>
  );
}
