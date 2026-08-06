import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { AchievementCard } from '../../entities/recap/AchievementCard';
import { ActionCard } from '../../entities/recap/ActionCard';
import { createCardVariants } from '../../entities/recap/createCardVariants';
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

/**
 * Полноэкранный overlay поверх страницы профиля.
 *
 * Он отвечает за:
 * - горизонтальную ленту карточек;
 * - прогресс и навигацию;
 * - закрытие по Escape;
 * - блокировку прокрутки страницы под overlay;
 * - стабильное случайное распределение цветов.
 */
export function RecapOverlay({
  recap,
  onClose,
}: RecapOverlayProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slidesCount =
    1 +
    recap.metrics.length +
    recap.achievements.length +
    1;

  /**
   * useMemo сохраняет результат до тех пор,
   * пока зависимости не изменились.
   * Поэтому цвета не пересчитываются на каждый render.
   */
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
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  /**
   * Прокручивает track к конкретной карточке.
   */
  function scrollToSlide(index: number) {
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

    target?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }

  /**
   * После ручного scroll определяем,
   * какая карточка ближе всего к центру контейнера.
   */
  function handleTrackScroll() {
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

    setCurrentSlide(nearestIndex);
  }

  function handleAction(action: RecapAction) {
    /**
     * Точное поведение action.type пока не закреплено.
     * Здесь оставлена безопасная временная точка интеграции.
     */
    console.info('Recap action:', action);
  }

  let variantIndex = 0;

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
                // Здесь index допустим как key: порядок статичен.
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

      <div
        ref={trackRef}
        className={styles.track}
        onScroll={handleTrackScroll}
      >
        <RoleCard
          role={recap.role}
          variant={variants[variantIndex++]}
        />

        {recap.metrics.map((metric, index) => (
          <MetricCard
            key={`${metric.type}-${index}`}
            metric={metric}
            variant={variants[variantIndex++]}
          />
        ))}

        {recap.achievements.map(
          (achievement, index) => (
            <AchievementCard
              key={`${achievement.code}-${index}`}
              achievement={achievement}
              variant={variants[variantIndex++]}
            />
          ),
        )}

        <ActionCard
          action={recap.action}
          variant={variants[variantIndex]}
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
