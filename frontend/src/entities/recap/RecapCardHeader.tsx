import logoSrc from '../../assets/logo.svg.webp';

import styles from './RecapCard.module.css';

type RecapCardHeaderProps = {
  title: string;
  className?: string;
};

export function RecapCardHeader({
  title,
  className,
}: RecapCardHeaderProps) {
  const headerClassName = [styles.header, className]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={headerClassName}>
      <img
        src={logoSrc}
        alt="Avito"
        className={styles.logoImage}
      />

      <h2 className={styles.title}>{title}</h2>
    </header>
  );
}
