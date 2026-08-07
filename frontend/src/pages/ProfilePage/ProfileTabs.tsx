import type { KeyboardEvent } from 'react';

import type { Achievement } from '../../entities/recap/types';

import styles from './ProfileTabs.module.css';

const PROFILE_TABS = [
  { id: 'statistics', label: 'Статистика' },
  { id: 'achievements', label: 'Достижения' },
] as const;

export type ProfileTab = (typeof PROFILE_TABS)[number]['id'];

type ProfileTabsProps = {
  activeTab: ProfileTab;
  achievements: Achievement[] | null;
  onTabChange: (tab: ProfileTab) => void;
};

export function ProfileTabs({
  activeTab,
  achievements,
  onTabChange,
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

        {activeTab === 'achievements' && achievements === null && (
          <p className={styles.emptyState}>
            hehe
          </p>
        )}

        {activeTab === 'achievements' &&
          achievements?.length === 0 && (
            <p className={styles.emptyState}>
              У выбранного профиля пока нет достижений.
            </p>
          )}

        {activeTab === 'achievements' &&
          achievements &&
          achievements.length > 0 && (
            <ul className={styles.achievementList}>
              {achievements.map((achievement) => (
                <li
                  key={achievement.code}
                  className={styles.achievement}
                >
                  <h3>{achievement.name}</h3>
                  <p>{achievement.description}</p>
                </li>
              ))}
            </ul>
          )}
      </section>
    </div>
  );
}
