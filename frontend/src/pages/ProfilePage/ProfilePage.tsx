import { useState } from 'react';
import type { Recap } from '../../entities/recap/types';
import { GenerateRecapButton } from '../../features/generate-recap/GenerateRecapButton';
import { RecapOverlay } from '../../widgets/RecapOverlay/RecapOverlay';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const [recap, setRecap] =
    useState<Recap | null>(null);

  return (
    
    <>

      <main className={styles.page}>
        {/* Верхняя панель. */}
        <header className={styles.header}>
          {/* Логотип-заглушка. */}
          <strong className={styles.logo}>
            Avito
          </strong>

          {/* Временная навигация. */}
          <nav className={styles.navigation}>
            Бизнес 360 · Авто · Недвижимость · Работа · Услуги
          </nav>
        </header>

        {/* Блок профиля. */}
        <section className={styles.profile}>
          {/* Аватар-заглушка. */}
          <div className={styles.avatar}>
            А
          </div>

          {/* Текст профиля. */}
          <div>
            <h1>Анна</h1>

            <p>
              Пользователь Авито с 2020 года
            </p>
          </div>
        </section>

        {/* Основной контент страницы. */}
        <section className={styles.content}>
          <h2>Твой профиль</h2>

          <p>
            Здесь пока находится заглушка обычной страницы профиля.
          </p>

          <GenerateRecapButton
            onGenerated={setRecap}
          />
        </section>
      </main>

      {recap && (
        <RecapOverlay
          // Передаём данные оверлею.
          recap={recap}

          onClose={() => setRecap(null)}
        />
      )}
    </>
  );
}