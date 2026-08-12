import { useId } from 'react';

import type {
  Achievement,
  AchievementProgress,
  AchievementsResponse,
  EarnedAchievement,
} from '../../entities/achievement/types';
import { ErrorMessage } from '../../shared/ui/ErrorMessage/ErrorMessage';
import { Loader } from '../../shared/ui/Loader/Loader';
import { SafeImage } from '../../shared/ui/SafeImage/SafeImage';

import styles from './ProfileTabs.module.css';

type AchievementsPanelProps = {
  achievements: AchievementsResponse | null;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
};

function AchievementImage({ achievement }: { achievement: Achievement }) {
  return (
    <div className={styles.imageFrame}>
      <SafeImage
        className={styles.achievementImage}
        src={achievement.imageUrl}
        alt=""
        loading="lazy"
        fallback={
          <div
            className={styles.imagePlaceholder}
            role="img"
            aria-label="Изображение достижения пока недоступно"
          >
            <span aria-hidden="true">★</span>
          </div>
        }
      />
    </div>
  );
}

type AchievementListProps = {
  achievements: Array<Achievement | EarnedAchievement>;
  locked?: boolean;
  progressByCode?: ReadonlyMap<string, AchievementProgress>;
};

const achievementDateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function formatEarnedAt(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'Дата получения неизвестна'
    : `Получено ${achievementDateFormatter.format(date)}`;
}

function normalizeProgress(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(Math.max(0, Math.min(value, 100)));
}

function AchievementProgressBar({
  achievementName,
  progress,
}: {
  achievementName: string;
  progress: AchievementProgress;
}) {
  const value = normalizeProgress(progress.progress);

  return (
    <div className={styles.achievementProgress}>
      <div className={styles.achievementProgressLabel}>
        <span>Прогресс</span>
        <strong>{value}%</strong>
      </div>
      <div
        className={styles.achievementProgressTrack}
        role="progressbar"
        aria-label={`Прогресс достижения «${achievementName}»`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <span
          className={styles.achievementProgressValue}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function AchievementListItem({
  achievement,
  locked,
  progress,
}: {
  achievement: Achievement | EarnedAchievement;
  locked: boolean;
  progress?: AchievementProgress;
}) {
  const tooltipId = useId();
  const earnedAt = 'earnedAt' in achievement ? achievement.earnedAt : null;

  return (
    <li
      className={`${styles.achievement} ${
        locked ? styles.achievementLocked : ''
      }`}
      tabIndex={earnedAt ? 0 : undefined}
      aria-describedby={earnedAt ? tooltipId : undefined}
    >
      <h3>{achievement.name}</h3>
      <AchievementImage achievement={achievement} />
      <p>{achievement.description}</p>
      <span className={styles.achievementStatus}>
        {locked ? 'Ещё не получено' : 'Получено'}
      </span>

      {locked && progress && (
        <AchievementProgressBar
          achievementName={achievement.name}
          progress={progress}
        />
      )}

      {earnedAt && (
        <span
          id={tooltipId}
          className={styles.achievementTooltip}
          role="tooltip"
        >
          {formatEarnedAt(earnedAt)}
        </span>
      )}
    </li>
  );
}

function AchievementList({
  achievements,
  locked = false,
  progressByCode,
}: AchievementListProps) {
  return (
    <ul className={styles.achievementList}>
      {achievements.map((achievement) => (
        <AchievementListItem
          key={achievement.code}
          achievement={achievement}
          locked={locked}
          progress={progressByCode?.get(achievement.code)}
        />
      ))}
    </ul>
  );
}

export function AchievementsPanel({
  achievements,
  isLoading,
  errorMessage,
  onRetry,
}: AchievementsPanelProps) {
  if (isLoading) {
    return <Loader label="Загружаем достижения…" />;
  }

  if (errorMessage) {
    return <ErrorMessage message={errorMessage} onRetry={onRetry} />;
  }

  if (achievements === null) {
    return (
      <p className={styles.emptyState}>Данные о достижениях пока недоступны.</p>
    );
  }

  const progressByCode = new Map(
    achievements.achievements_progress.map((progress) => [
      progress.code,
      progress,
    ]),
  );

  return (
    <div className={styles.achievementSections}>
      <section className={styles.achievementSection}>
        <h2>Полученные</h2>
        {achievements.earned.length > 0 ? (
          <AchievementList achievements={achievements.earned} />
        ) : (
          <p className={styles.emptyState}>
            У выбранного профиля пока нет достижений.
          </p>
        )}
      </section>

      <section className={styles.achievementSection}>
        <h2>Ещё не получены</h2>
        {achievements.locked.length > 0 ? (
          <AchievementList
            achievements={achievements.locked}
            locked
            progressByCode={progressByCode}
          />
        ) : (
          <p className={styles.emptyState}>
            Все доступные достижения уже получены.
          </p>
        )}
      </section>
    </div>
  );
}
