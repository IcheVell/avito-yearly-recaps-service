import { useState } from 'react';

import logoSrc from '../../assets/logo.svg.webp';
import type { Profile } from '../../entities/profile/types';
import type { Recap } from '../../entities/recap/types';
import { GenerateRecapButton } from '../../features/generate-recap/GenerateRecapButton';
import { getApiErrorMessage } from '../../shared/api/apiError';
import { useGetProfilesQuery } from '../../shared/api/profilesApi';
import { ErrorMessage } from '../../shared/ui/ErrorMessage/ErrorMessage';
import { Loader } from '../../shared/ui/Loader/Loader';
import { RecapOverlay } from '../../widgets/RecapOverlay/RecapOverlay';

import styles from './ProfilePage.module.css';

const RECAP_YEAR = 2026;


export function ProfilePage() {
  const [selectedProfileId, setSelectedProfileId] =
    useState<number | null>(null);
  const [recap, setRecap] = useState<Recap | null>(null);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useGetProfilesQuery();


  const selectedProfile: Profile | undefined =
    data?.items.find(
      (profile) => profile.id === selectedProfileId,
    ) ?? data?.items[0];

  return (
    <>
      <main className={styles.page}>
        <header className={styles.header}>
          <img
            className={styles.logo}
            src={logoSrc}
            alt="Avito"
          />

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

            {isLoading && (
              <Loader label="Загружаем профили…" />
            )}

            {error && (
              <ErrorMessage
                message={getApiErrorMessage(error)}
                onRetry={refetch}
              />
            )}

            {data && (
              <div className={styles.profileList}>
                {data.items.map((profile) => {
                  const isSelected =
                    profile.id === selectedProfile?.id;

                  return (
                    <button
                      key={profile.id}
                      className={`${styles.profileCard} ${
                        isSelected
                          ? styles.profileCardSelected
                          : ''
                      }`}
                      type="button"
                      onClick={() =>
                        setSelectedProfileId(profile.id)
                      }
                      aria-pressed={isSelected}
                    >
                      <img
                        src={profile.imageUrl}
                        alt=""
                        width="64"
                        height="64"
                      />
                      <span title={profile.username}>
                        {profile.username}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <section className={styles.contentColumn}>
            {selectedProfile && (
              <div className={styles.profileDetails}>
                <img
                  src={selectedProfile.imageUrl}
                  alt=""
                  width="108"
                  height="108"
                />

                <div>
                  <p className={styles.eyebrow}>Текущий профиль</p>
                  <h2>{selectedProfile.username}</h2>
                  <p>
                    ID пользователя: {selectedProfile.id}. Итоги за{' '}
                    {RECAP_YEAR} год.
                  </p>

                  <GenerateRecapButton
                    userId={selectedProfile.id}
                    year={RECAP_YEAR}
                    onGenerated={setRecap}
                  />
                </div>
              </div>
            )}

            <div
              className={styles.emptyPanel}
              aria-label="Область содержимого"
            />
          </section>
        </div>
      </main>

      {recap && (
        <RecapOverlay
          recap={recap}
          onClose={() => setRecap(null)}
        />
      )}
    </>
  );
}
