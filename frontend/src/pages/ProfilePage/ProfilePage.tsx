import { useEffect, useState } from 'react';

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

const RECAP_YEAR = 2025;


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


  useEffect(() => {
    if (
      selectedProfileId === null &&
      data?.items.length
    ) {
      setSelectedProfileId(data.items[0].id);
    }
  }, [data, selectedProfileId]);

  const selectedProfile: Profile | undefined =
    data?.items.find(
      (profile) => profile.id === selectedProfileId,
    );

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
        </header>

        <section className={styles.hero}>
          <p className={styles.eyebrow}>Итоги года</p>
          <h1>Выбери тестовый профиль</h1>
          <p>
            Recap откроется поверх этой страницы, как модальная
            горизонтальная история.
          </p>
        </section>

        {isLoading && (
          <section className={styles.panel}>
            <Loader label="Загружаем профили…" />
          </section>
        )}

        {error && (
          <section className={styles.panel}>
            <ErrorMessage
              message={getApiErrorMessage(error)}
              onRetry={refetch}
            />
          </section>
        )}

        {data && (
          <section className={styles.panel}>
            <h2>Профили</h2>

            <div className={styles.profileList}>
              {data.items.map((profile) => {
                const isSelected =
                  profile.id === selectedProfileId;

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
                      width="72"
                      height="72"
                    />
                    <span>{profile.username}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {selectedProfile && (
          <section className={styles.profileDetails}>
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
          </section>
        )}
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
