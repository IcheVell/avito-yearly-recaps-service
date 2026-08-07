import { useId, useState } from 'react';

import type {
  Achievement,
  AchievementsResponse,
  EarnedAchievement,
} from '../../entities/achievement/types';
import { ErrorMessage } from '../../shared/ui/ErrorMessage/ErrorMessage';
import { Loader } from '../../shared/ui/Loader/Loader';

import styles from './ProfileTabs.module.css';

type AchievementsPanelProps = {
  achievements: AchievementsResponse | null;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
};

function AchievementImage({
  achievement,
}: {
  achievement: Achievement;
}) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(
    null,
  );
  const canShowImage =
    achievement.imageUrl.length > 0 &&
    failedImageUrl !== achievement.imageUrl;

  return (
    <div className={styles.imageFrame}>
      {canShowImage ? (
        <img
          className={styles.achievementImage}
          src={achievement.imageUrl}
          alt=""
          loading="lazy"
          onError={() => setFailedImageUrl(achievement.imageUrl)}
        />
      ) : (
        <div
          className={styles.imagePlaceholder}
          role="img"
          aria-label="Изображение достижения пока недоступно"
        >
          <span aria-hidden="true">★</span>
        </div>
      )}
    </div>
  );
}

type AchievementListProps = {
  achievements: Array<Achievement | EarnedAchievement>;
  locked?: boolean;
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

function AchievementListItem({
  achievement,
  locked,
}: {
  achievement: Achievement | EarnedAchievement;
  locked: boolean;
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
}: AchievementListProps) {
  return (
    <ul className={styles.achievementList}>
      {achievements.map((achievement) => (
        <AchievementListItem
          key={achievement.code}
          achievement={achievement}
          locked={locked}
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
      <p className={styles.emptyState}>
        Данные о достижениях пока недоступны.
      </p>
    );
  }

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
          <AchievementList achievements={achievements.locked} locked />
        ) : (
          <p className={styles.emptyState}>
            Все доступные достижения уже получены.
          </p>
        )}
      </section>
    </div>
  );
}
