import { useCallback, useEffect, useRef, useState } from 'react';

import logoSrc from '../../assets/logo.svg.webp';
import type { Profile } from '../../entities/profile/types';
import type { Recap } from '../../entities/recap/types';
import { useGetAchievementsQuery } from '../../shared/api/achievementsApi';
import { getApiErrorMessage } from '../../shared/api/apiError';
import { useGetProfilesQuery } from '../../shared/api/profilesApi';
import { useGetStatsQuery } from '../../shared/api/statsApi';
import { ErrorMessage } from '../../shared/ui/ErrorMessage/ErrorMessage';
import { Loader } from '../../shared/ui/Loader/Loader';
import { RecapOverlay } from '../../widgets/RecapOverlay/RecapOverlay';

import { AchievementsPanel } from './AchievementsPanel';
import { ProfileList } from './ProfileList';
import styles from './ProfilePage.module.css';
import { ProfileSummary } from './ProfileSummary';
import { ProfileTabs, type ProfileTab } from './ProfileTabs';
import { StatisticsPanel } from './StatisticsPanel';

export function ProfilePage() {
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<ProfileTab>('statistics');
  const [openRecap, setOpenRecap] = useState<Recap | null>(null);
  const selectedProfileIdRef = useRef<number | null>(null);

  const { data, isLoading, error, refetch } = useGetProfilesQuery();

  const selectedProfile: Profile | undefined =
    data?.items.find((profile) => profile.id === selectedProfileId) ??
    data?.items[0];

  useEffect(() => {
    selectedProfileIdRef.current = selectedProfile?.id ?? null;
  }, [selectedProfile?.id]);

  const handleProfileSelect = useCallback((profileId: number) => {
    selectedProfileIdRef.current = profileId;
    setSelectedProfileId(profileId);
    setOpenRecap(null);
  }, []);

  const handleRecapReceived = useCallback((recap: Recap) => {
    if (recap.userId === selectedProfileIdRef.current) {
      setOpenRecap(recap);
    }
  }, []);

  const shouldLoadStats =
    activeTab === 'statistics' && selectedProfile !== undefined;

  const {
    data: statsData,
    isFetching: isStatsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useGetStatsQuery(selectedProfile?.id ?? 0, {
    skip: !shouldLoadStats,
  });

  const shouldLoadAchievements =
    activeTab === 'achievements' && selectedProfile !== undefined;

  const {
    data: achievementsData,
    isFetching: isAchievementsLoading,
    error: achievementsError,
    refetch: refetchAchievements,
  } = useGetAchievementsQuery(selectedProfile?.id ?? 0, {
    skip: !shouldLoadAchievements,
  });

  return (
    <>
      <main className={styles.page}>
        <header className={styles.header}>
          <img className={styles.logo} src={logoSrc} alt="Avito" />

          <nav className={styles.navigation}>
            Бизнес 360 · Авто · Недвижимость · Работа · Услуги
          </nav>

          <span className={styles.headerMessage}>
            Hello kitty and her friends
          </span>
        </header>

        <div className={styles.workspace}>
          <aside className={styles.profilesPanel}>
            <h1>Профили</h1>

            {isLoading && <Loader label="Загружаем профили…" />}

            {error && (
              <ErrorMessage
                message={getApiErrorMessage(error)}
                onRetry={refetch}
              />
            )}

            {data && (
              <ProfileList
                profiles={data.items}
                selectedProfileId={selectedProfile?.id ?? 0}
                onSelect={handleProfileSelect}
              />
            )}
          </aside>

          <section className={styles.contentColumn}>
            {data && selectedProfile && (
              <ProfileSummary
                profile={selectedProfile}
                year={data.currentYear}
                onRecapReceived={handleRecapReceived}
              />
            )}

            <div className={styles.profileContentPanel}>
              <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab}>
                {activeTab === 'statistics' ? (
                  <StatisticsPanel
                    stats={statsData ?? null}
                    isLoading={isStatsLoading}
                    errorMessage={
                      statsError ? getApiErrorMessage(statsError) : null
                    }
                    onRetry={refetchStats}
                  />
                ) : (
                  <AchievementsPanel
                    achievements={achievementsData ?? null}
                    isLoading={isAchievementsLoading}
                    errorMessage={
                      achievementsError
                        ? getApiErrorMessage(achievementsError)
                        : null
                    }
                    onRetry={refetchAchievements}
                  />
                )}
              </ProfileTabs>
            </div>
          </section>
        </div>
      </main>

      {openRecap && (
        <RecapOverlay recap={openRecap} onClose={() => setOpenRecap(null)} />
      )}
    </>
  );
}
