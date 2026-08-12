import { useEffect, useMemo, useState } from 'react';

import { RecapActionModal } from '../../features/recap-action/RecapActionModal';
import { createCardVariants } from '../../entities/recap/createCardVariants';
import type { Recap, RecapAction } from '../../entities/recap/types';

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

export function RecapOverlay({ recap, onClose }: RecapOverlayProps) {
  const slides = useMemo(() => createRecapSlides(recap), [recap]);
  const slidesCount = slides.length;
  const [activeAction, setActiveAction] = useState<RecapAction | null>(null);

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
    () => createCardVariants(`${recap.id}-${recap.createdAt}`, slidesCount),
    [recap.id, recap.createdAt, slidesCount],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (activeAction) {
          return;
        }

        onClose();
        return;
      }

      if (activeAction) {
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
  }, [activeAction, goToNextSlide, goToPreviousSlide, onClose]);

  function onAction(action: RecapAction) {
    setActiveAction(action);
  }

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

      {slides[currentSlide]?.kind === 'intro' && <RecapFireworks />}

      <div ref={trackRef} className={styles.track} onScroll={handleTrackScroll}>
        {slides.map((slide, index) => (
          <RecapSlideView
            key={slide.id}
            slide={slide}
            variant={variants[index]}
            isActive={currentSlide === index}
            onAction={onAction}
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

      {activeAction && (
        <RecapActionModal
          action={activeAction}
          onClose={() => setActiveAction(null)}
        />
      )}
    </div>
  );
}
