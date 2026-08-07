import {
  type KeyboardEvent,
  useState,
} from 'react';

import type { EarnedAchievement } from '../../entities/achievement/types';
import { ErrorMessage } from '../../shared/ui/ErrorMessage/ErrorMessage';
import { Loader } from '../../shared/ui/Loader/Loader';

import styles from './ProfileTabs.module.css';

const PROFILE_TABS = [
  { id: 'statistics', label: 'Статистика' },
  { id: 'achievements', label: 'Достижения' },
] as const;

export type ProfileTab = (typeof PROFILE_TABS)[number]['id'];

type ProfileTabsProps = {
  activeTab: ProfileTab;
  achievements: EarnedAchievement[] | null;
  isAchievementsLoading: boolean;
  achievementsErrorMessage: string | null;
  onTabChange: (tab: ProfileTab) => void;
  onRetryAchievements: () => void;
};

function AchievementImage({
  achievement,
}: {
  achievement: EarnedAchievement;
}) {
  const [failedImageUrl, setFailedImageUrl] = useState<
    string | null
  >(null);

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

export function ProfileTabs({
  activeTab,
  achievements,
  isAchievementsLoading,
  achievementsErrorMessage,
  onTabChange,
  onRetryAchievements,
}: ProfileTabsProps) {
  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    if (
      event.key !== 'ArrowLeft' &&
      event.key !== 'ArrowRight'
    ) {
      return;
    }

    event.preventDefault();

    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex =
      (currentIndex + direction + PROFILE_TABS.length) %
      PROFILE_TABS.length;
    const nextTab = PROFILE_TABS[nextIndex];

    onTabChange(nextTab.id);

    const tabButtons =
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]',
      );

    tabButtons?.item(nextIndex).focus();
  }

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.tabList}
        role="tablist"
        aria-label="Информация о выбранном профиле"
      >
        {PROFILE_TABS.map((tab, index) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              id={`profile-${tab.id}-tab`}
              className={`${styles.tab} ${
                isActive ? styles.tabActive : ''
              }`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="profile-tab-panel"
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(event) =>
                handleTabKeyDown(event, index)
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <section
        id="profile-tab-panel"
        className={styles.panel}
        role="tabpanel"
        aria-labelledby={`profile-${activeTab}-tab`}
      >
        {activeTab === 'statistics' && (
          <p className={styles.emptyState}>
            hehe
          </p>
        )}

        {activeTab === 'achievements' &&
          isAchievementsLoading && (
            <Loader label="Загружаем достижения…" />
          )}

        {activeTab === 'achievements' &&
          !isAchievementsLoading &&
          achievementsErrorMessage && (
            <ErrorMessage
              message={achievementsErrorMessage}
              onRetry={onRetryAchievements}
            />
          )}

        {activeTab === 'achievements' &&
          !isAchievementsLoading &&
          !achievementsErrorMessage &&
          achievements === null && (
            <p className={styles.emptyState}>
              Данные о достижениях пока недоступны.
            </p>
          )}

        {activeTab === 'achievements' &&
          !isAchievementsLoading &&
          !achievementsErrorMessage &&
          achievements?.length === 0 && (
            <p className={styles.emptyState}>
              У выбранного профиля пока нет достижений.
            </p>
          )}

        {activeTab === 'achievements' &&
          !isAchievementsLoading &&
          !achievementsErrorMessage &&
          achievements &&
          achievements.length > 0 && (
            <ul className={styles.achievementList}>
              {achievements.map((achievement) => (
                <li
                  key={achievement.code}
                  className={styles.achievement}
                >
                  <h3>{achievement.name}</h3>
                  <AchievementImage achievement={achievement} />
                  <p>{achievement.description}</p>
                </li>
              ))}
            </ul>
          )}
      </section>
    </div>
  );
}
