import { ShareRecapCard } from '../../entities/recap/ShareRecapCard';
import { getApiErrorMessage } from '../../shared/api/apiError';
import { useGetShareRecapQuery } from '../../shared/api/shareRecapApi';
import { ErrorMessage } from '../../shared/ui/ErrorMessage/ErrorMessage';
import { Loader } from '../../shared/ui/Loader/Loader';

import styles from './ShareRecapPage.module.css';

type ShareRecapPageProps = {
  token: string;
};

const SNOWFLAKES = [
  styles.snow1,
  styles.snow2,
  styles.snow3,
  styles.snow4,
  styles.snow5,
  styles.snow6,
  styles.snow7,
  styles.snow8,
  styles.snow9,
  styles.snow10,
] as const;

export function ShareRecapPage({ token }: ShareRecapPageProps) {
  const { data, isLoading, isFetching, error, refetch } = useGetShareRecapQuery(
    token,
    { skip: token.length === 0 },
  );

  return (
    <main className={styles.page}>
      <div className={styles.snow} aria-hidden="true">
        {SNOWFLAKES.map((snowClassName) => (
          <span
            key={snowClassName}
            className={`${styles.fallingSnowflake} ${snowClassName}`}
          >
            ❄
          </span>
        ))}
      </div>

      {token.length === 0 && (
        <div className={styles.state}>
          <ErrorMessage message="Ссылка неполная. Проверьте адрес страницы." />
        </div>
      )}

      {token.length > 0 && (isLoading || isFetching) && !data && (
        <div className={styles.state}>
          <Loader label="Загружаем итоги…" />
        </div>
      )}

      {token.length > 0 && error && !data && (
        <div className={styles.state}>
          <ErrorMessage
            message={getApiErrorMessage(error)}
            onRetry={() => {
              void refetch();
            }}
          />
        </div>
      )}

      {data && <ShareRecapCard recap={data} />}
    </main>
  );
}
