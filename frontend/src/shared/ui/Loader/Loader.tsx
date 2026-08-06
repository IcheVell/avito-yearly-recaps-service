import styles from './Loader.module.css';

type LoaderProps = {
  label?: string;
};


export function Loader({ label = 'Загрузка…' }: LoaderProps) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
