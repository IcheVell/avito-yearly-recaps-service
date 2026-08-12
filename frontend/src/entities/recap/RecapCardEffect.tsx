import type { CSSProperties } from 'react';

import styles from './RecapCard.module.css';

type SnowflakeStyle = CSSProperties & {
  '--snow-left': string;
  '--snow-delay': string;
  '--snow-duration': string;
  '--snow-drift': string;
  '--snow-size': string;
  '--snow-opacity': number;
};

const SNOWFLAKES: SnowflakeStyle[] = Array.from({ length: 22 }, (_, index) => {
  const seed = index + 1;

  return {
    '--snow-left': `${(seed * 37) % 101}%`,
    '--snow-delay': `${-((seed * 0.73) % 8).toFixed(2)}s`,
    '--snow-duration': `${(5.5 + ((seed * 1.17) % 5)).toFixed(2)}s`,
    '--snow-drift': `${((seed * 29) % 72) - 36}px`,
    '--snow-size': `${12 + ((seed * 11) % 18)}px`,
    '--snow-opacity': 0.35 + ((seed * 13) % 55) / 100,
  };
});

export function RecapCardEffect() {
  return (
    <div
      className={`${styles.cardEffect} ${styles.snowEffect}`}
      aria-hidden="true"
    >
      {SNOWFLAKES.map((snowflakeStyle, index) => (
        <span key={index} style={snowflakeStyle}>
          ❄
        </span>
      ))}
    </div>
  );
}
