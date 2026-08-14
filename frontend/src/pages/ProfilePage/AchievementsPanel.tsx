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

const achievementValueFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 1,
});

const achievementCurrencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

const metricLabels: Record<string, string> = {
  max_streak_days: 'Серия активности',
  buys_count: 'Покупки',
  sells_count: 'Продажи',
  favorites_count: 'Избранное',
  spent_amount: 'Потраченная сумма',
  seller_rating: 'Рейтинг продавца',
  conversations_count: 'Диалоги',
  max_inactive_gap_days: 'Перерыв между активностями',
};

const operatorLabels: Record<string, string> = {
  '>=': 'не меньше',
  '>': 'больше',
  '<=': 'не больше',
  '<': 'меньше',
  '==': 'равно',
};

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

function formatConditionValue(metric: string, value: string): string {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return value;
  }

  if (metric === 'spent_amount') {
    return achievementCurrencyFormatter.format(numericValue);
  }

  const formattedValue = achievementValueFormatter.format(numericValue);
  if (metric === 'max_streak_days' || metric === 'max_inactive_gap_days') {
    return `${formattedValue} дн.`;
  }

  return formattedValue;
}

function collectConditionProgress(
  progress: AchievementProgress,
): AchievementProgress[] {
  return [
    ...(progress.condition ? [progress] : []),
    ...(progress.children ?? []).flatMap(collectConditionProgress),
  ];
}

function getProgressRuleDescription(progress: AchievementProgress): string {
  if (progress.type === 'all') {
    return 'Нужно выполнить все условия';
  }

  if (progress.type === 'any') {
    return 'Достаточно выполнить одно условие';
  }

  return 'Условие достижения';
}

function AchievementProgressTooltip({
  progress,
}: {
  progress: AchievementProgress;
}) {
  const conditions = collectConditionProgress(progress);

  return (
    <>
      <strong className={styles.achievementTooltipTitle}>
        {getProgressRuleDescription(progress)}
      </strong>

      {conditions.length > 0 ? (
        <ul className={styles.achievementTooltipConditions}>
          {conditions.map((conditionProgress, index) => {
            const condition = conditionProgress.condition;
            if (!condition) {
              return null;
            }

            const metricLabel =
              metricLabels[condition.metric] ?? condition.metric;
            const operatorLabel =
              operatorLabels[condition.operator] ?? condition.operator;

            return (
              <li key={`${condition.metric}-${index}`}>
                <strong>{metricLabel}</strong>
                <span>
                  Сейчас{' '}
                  {formatConditionValue(condition.metric, condition.current)}
                  {' · '}нужно {operatorLabel}{' '}
                  {formatConditionValue(condition.metric, condition.target)}
                </span>
                <span>
                  {conditionProgress.isComplete ? 'Выполнено' : 'В процессе'}
                  {' · '}
                  {normalizeProgress(conditionProgress.progress)}%
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <span>Подробности условий пока недоступны.</span>
      )}
    </>
  );
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
  const hasTooltip = earnedAt !== null || progress !== undefined;

  return (
    <li
      className={`${styles.achievement} ${
        locked ? styles.achievementLocked : ''
      }`}
      tabIndex={hasTooltip ? 0 : undefined}
      aria-describedby={hasTooltip ? tooltipId : undefined}
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

      {hasTooltip && (
        <span
          id={tooltipId}
          className={styles.achievementTooltip}
          role="tooltip"
        >
          {earnedAt ? (
            formatEarnedAt(earnedAt)
          ) : progress ? (
            <AchievementProgressTooltip progress={progress} />
          ) : null}
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
    achievements.achievementsProgress.map((progress) => [
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
