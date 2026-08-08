import { useEffect, useMemo } from 'react';

import { createCardVariants } from '../../entities/recap/createCardVariants';
import type { Recap } from '../../entities/recap/types';

import { handleRecapAction } from './model/handleRecapAction';
import { createRecapSlides } from './model/recapSlides';
import { useRecapCarousel } from './model/useRecapCarousel';
import { RecapControls } from './RecapControls';
import { RecapFireworks } from './RecapFireworks';
import styles from './RecapOverlay.module.css';
import { RecapProgress } from './RecapProgress';
import { RecapSlideView } from './RecapSlideView';

type RecapOverlayProps = {
  recap: Recap;
  onClose: () => void;
};

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

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`Итоги ${recap.year} года`}
    >
      <RecapProgress
        slides={slides}
        currentSlide={currentSlide}
        onSelectSlide={scrollToSlide}
        onClose={onClose}
      />

      {slides[currentSlide]?.kind === 'intro' && (
        <RecapFireworks />
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
            onAction={handleRecapAction}
          />
        ))}
      </div>

      <RecapControls
        currentSlide={currentSlide}
        slidesCount={slidesCount}
        isFirstSlide={isFirstSlide}
        isLastSlide={isLastSlide}
        onPrevious={goToPreviousSlide}
        onNext={goToNextSlide}
      />
    </div>
  );
}
