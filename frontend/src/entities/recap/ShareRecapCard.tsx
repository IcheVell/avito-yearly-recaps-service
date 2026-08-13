import type { ReactNode } from 'react';

import logoSrc from '../../assets/logo.svg.webp';
import { toRootRelativeUrl } from '../../shared/lib/toRootRelativeUrl';
import { SafeImage } from '../../shared/ui/SafeImage/SafeImage';

import type { ShareRecap } from './types';

import styles from './ShareRecapCard.module.css';

type ShareRecapCardProps = {
  recap: ShareRecap;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderHighlighted(text: string, highlights: string[]): ReactNode {
  const uniqueHighlights = [
    ...new Set(highlights.map((item) => item.trim()).filter(Boolean)),
  ];

  if (uniqueHighlights.length === 0 || !text) {
    return text;
  }

  const pattern = uniqueHighlights.map(escapeRegExp).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    const isHighlight = uniqueHighlights.some(
      (highlight) => highlight.toLowerCase() === part.toLowerCase(),
    );

    return isHighlight ? (
      <span key={`${part}-${index}`} className={styles.highlight}>
        {part}
      </span>
    ) : (
      part
    );
  });
}

export function ShareRecapCard({ recap }: ShareRecapCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.content}>
        <div className={styles.heroDecor} aria-hidden="true">
          <span className={styles.snowflakeTop}>❄</span>
          <span className={styles.snowflakeLeft}>❄</span>
        </div>

        <header className={styles.header}>
          <img className={styles.logo} src={logoSrc} alt="Avito" />
        </header>

        <div className={styles.hero}>
          <p className={styles.lead}>Итоги за</p>
          <p className={styles.year}>{recap.year}</p>
          <p className={styles.leadAfter}>год на Avito</p>
        </div>

        {recap.role.title || recap.role.name ? (
          <section className={styles.section}>
            {recap.role.name ? (
              <p className={styles.heading}>
                <strong className={styles.label}>Твоя роль:</strong>{' '}
                <span className={styles.highlight}>{recap.role.name}</span>
              </p>
            ) : (
              <h2 className={styles.sectionTitle}>Твоя роль:</h2>
            )}
            {recap.role.title ? (
              <p className={styles.body}>{recap.role.title}</p>
            ) : null}
          </section>
        ) : null}

        {recap.metrics.map((metric) => (
          <section key={metric.type} className={styles.section}>
            <h2 className={styles.sectionTitle}>{metric.title}</h2>
            <p className={styles.body}>
              {renderHighlighted(metric.text, metric.highlights)}
            </p>
          </section>
        ))}

        {recap.achievements.length > 0 ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Твои достижения за этот год:
            </h2>
            <ul className={styles.badges}>
              {recap.achievements.map((achievement) => (
                <li key={achievement.code} className={styles.badgeItem}>
                  <div className={styles.badge}>
                    <SafeImage
                      className={styles.badgeImage}
                      src={toRootRelativeUrl(achievement.imageUrl)}
                      alt={achievement.name}
                      loading="lazy"
                      fallback={
                        <span
                          className={styles.badgeFallback}
                          aria-hidden="true"
                        >
                          ★
                        </span>
                      }
                    />
                  </div>
                  <p className={styles.badgeName}>{achievement.name}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <a className={styles.cta} href="/">
          Получить свои итоги года
        </a>
      </div>
    </article>
  );
}
