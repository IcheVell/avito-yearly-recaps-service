import styles from './RecapOverlay.module.css';

const FIREWORK_PARTICLES = Array.from({ length: 12 });

function Firework({ className }: { className: string }) {
  return (
    <span className={`${styles.overlayFirework} ${className}`}>
      {FIREWORK_PARTICLES.map((_, index) => (
        <i key={index} />
      ))}
    </span>
  );
}

export function RecapFireworks() {
  return (
    <div className={styles.fireworksLayer} aria-hidden="true">
      <Firework className={styles.fireworkUpperLeft} />
      <Firework className={styles.fireworkUpperRight} />
      <Firework className={styles.fireworkLowerLeft} />
      <Firework className={styles.fireworkLowerRight} />
    </div>
  );
}
