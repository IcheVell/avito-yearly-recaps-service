import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { AchievementCard } from '../../entities/recap/AchievementCard';
import { ActionCard } from '../../entities/recap/ActionCard';
import { createCardVariants } from '../../entities/recap/createCardVariants';
import { IntroCard } from '../../entities/recap/IntroCard';
import { MetricCard } from '../../entities/recap/MetricCard';
import { RoleCard } from '../../entities/recap/RoleCard';
import type {
  Recap,
  RecapAction,
} from '../../entities/recap/types';
import { CloseRecapButton } from '../../features/close-recap/CloseRecapButton';

import styles from './RecapOverlay.module.css';

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
  const trackRef = useRef<HTMLDivElement>(null);
  const currentSlideRef = useRef(0);
  const programmaticSlideRef = useRef<number | null>(null);
  const scrollEndTimerRef = useRef<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slidesCount =
    1 +
    1 +
    recap.metrics.length +
    recap.achievements.length +
    1;

  const variants = useMemo(
    () =>
      createCardVariants(
        `${recap.id}-${recap.createdAt}`,
        slidesCount,
      ),
    [recap.id, recap.createdAt, slidesCount],
  );

  const scrollToSlide = useCallback(
    (index: number) => {
      const track = trackRef.current;

      if (!track) {
        return;
      }

      const safeIndex = Math.max(
        0,
        Math.min(index, slidesCount - 1),
      );

      const target = track.children.item(
        safeIndex,
      ) as HTMLElement | null;

      if (safeIndex === currentSlideRef.current) {
        return;
      }

      programmaticSlideRef.current = safeIndex;
      currentSlideRef.current = safeIndex;
      setCurrentSlide(safeIndex);

      target?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    },
    [slidesCount],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        scrollToSlide(currentSlideRef.current - 1);
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        scrollToSlide(currentSlideRef.current + 1);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);

      if (scrollEndTimerRef.current !== null) {
        window.clearTimeout(scrollEndTimerRef.current);
      }
    };
  }, [onClose, scrollToSlide]);

  function updateCurrentSlideFromTrack() {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const center =
      track.scrollLeft + track.clientWidth / 2;

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    Array.from(track.children).forEach(
      (child, index) => {
        const element = child as HTMLElement;
        const elementCenter =
          element.offsetLeft + element.offsetWidth / 2;
        const distance = Math.abs(
          elementCenter - center,
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      },
    );

    currentSlideRef.current = nearestIndex;
    setCurrentSlide(nearestIndex);
  }

  function handleTrackScroll() {
    if (programmaticSlideRef.current === null) {
      updateCurrentSlideFromTrack();
      return;
    }

    if (scrollEndTimerRef.current !== null) {
      window.clearTimeout(scrollEndTimerRef.current);
    }

    scrollEndTimerRef.current = window.setTimeout(() => {
      scrollEndTimerRef.current = null;
      programmaticSlideRef.current = null;
      updateCurrentSlideFromTrack();
    }, 120);
  }

  function handleAction(action: RecapAction) {
    /**
     * заглушка
     */
    console.info('Recap action:', action);
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
          {Array.from({ length: slidesCount }).map(
            (_, index) => (
              <button
                key={index}
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

      {currentSlide === 0 && (
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
        <IntroCard
          year={recap.year}
          variant={variants[0]}
          isActive={currentSlide === 0}
        />

        <RoleCard
          role={recap.role}
          variant={variants[1]}
          isActive={currentSlide === 1}
        />

        {recap.metrics.map((metric, index) => {
          const slideIndex = index + 2;

          return (
            <MetricCard
              key={`${metric.type}-${index}`}
              metric={metric}
              variant={variants[slideIndex]}
              isActive={currentSlide === slideIndex}
            />
          );
        })}

        {recap.achievements.map(
          (achievement, index) => {
            const slideIndex =
              recap.metrics.length + index + 2;

            return (
              <AchievementCard
                key={`${achievement.code}-${index}`}
                achievement={achievement}
                variant={variants[slideIndex]}
                isActive={currentSlide === slideIndex}
              />
            );
          },
        )}

        <ActionCard
          action={recap.action}
          variant={variants[slidesCount - 1]}
          isActive={currentSlide === slidesCount - 1}
          onAction={handleAction}
        />
      </div>

      <footer className={styles.controls}>
        <button
          type="button"
          onClick={() => scrollToSlide(currentSlide - 1)}
          disabled={currentSlide === 0}
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
          onClick={() => scrollToSlide(currentSlide + 1)}
          disabled={currentSlide === slidesCount - 1}
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
