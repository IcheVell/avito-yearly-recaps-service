import { useCallback, useEffect, useRef, useState } from 'react';

import fortuneCookieSrc from '../../assets/fortune-cookie.png';
import type { Prediction } from '../../entities/prediction/types';

import styles from './FortuneCookieButton.module.css';
import { useGetPrediction } from './model/useGetPrediction';

type FortuneCookieButtonProps = {
  userId: number;
  nextYear: number;
};

type CookieStage = 'idle' | 'cracking' | 'ready' | 'opened' | 'error';

function CookieVisual({ stage }: { stage: CookieStage }) {
  return (
    <div className={`${styles.cookieAssembly} ${styles[stage]}`}>
      <img className={styles.cookieWhole} src={fortuneCookieSrc} alt="" />
      <span className={`${styles.cookiePiece} ${styles.cookiePieceLeft}`}>
        <img src={fortuneCookieSrc} alt="" />
      </span>
      <span className={`${styles.cookiePiece} ${styles.cookiePieceRight}`}>
        <img src={fortuneCookieSrc} alt="" />
      </span>
      <span className={`${styles.crack} ${styles.crackOne}`} />
      <span className={`${styles.crack} ${styles.crackTwo}`} />
      <span className={`${styles.crack} ${styles.crackThree}`} />
      <span className={`${styles.crumb} ${styles.crumbOne}`} />
      <span className={`${styles.crumb} ${styles.crumbTwo}`} />
      <span className={`${styles.crumb} ${styles.crumbThree}`} />
    </div>
  );
}

export function FortuneCookieButton({
  userId,
  nextYear,
}: FortuneCookieButtonProps) {
  const [stage, setStage] = useState<CookieStage>('idle');
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const activeUserIdRef = useRef(userId);
  const isOpenRef = useRef(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const paperButtonRef = useRef<HTMLButtonElement>(null);

  const handlePredictionReceived = useCallback((result: Prediction) => {
    if (!isOpenRef.current || result.userId !== activeUserIdRef.current) {
      return;
    }

    setPrediction(result);
    setStage('ready');
  }, []);

  const handlePredictionError = useCallback(() => {
    if (isOpenRef.current) {
      setStage('error');
    }
  }, []);

  const { getPrediction, isGetting, errorMessage } = useGetPrediction({
    userId,
    onReceived: handlePredictionReceived,
    onError: handlePredictionError,
  });

  const close = useCallback(() => {
    isOpenRef.current = false;
    setStage('idle');
    setPrediction(null);
  }, []);

  const startCracking = useCallback(() => {
    isOpenRef.current = true;
    setPrediction(null);
    setStage('cracking');
    void getPrediction();
  }, [getPrediction]);

  useEffect(() => {
    if (stage === 'idle') {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [close, stage]);

  useEffect(() => {
    if (stage === 'ready') {
      paperButtonRef.current?.focus();
    }
  }, [stage]);

  return (
    <>
      <button
        className={styles.iconButton}
        type="button"
        aria-label={`Предсказание на ${nextYear} год`}
        data-tooltip={`Предсказание на ${nextYear} год`}
        onClick={startCracking}
      >
        <img className={styles.miniCookie} src={fortuneCookieSrc} alt="" />
      </button>

      {stage !== 'idle' && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label={`Предсказание на ${nextYear} год`}
        >
          <button
            className={styles.backdrop}
            type="button"
            aria-label="Закрыть предсказание"
            onClick={close}
          />

          <button
            ref={closeButtonRef}
            className={styles.closeButton}
            type="button"
            aria-label="Закрыть окно"
            onClick={close}
          />

          <div className={styles.scene}>
            <CookieVisual stage={stage} />

            {stage === 'cracking' && (
              <span className={styles.srOnly} role="status">
                {isGetting
                  ? 'Печенье раскрывает предсказание…'
                  : 'Готовим печенье…'}
              </span>
            )}

            {(stage === 'ready' || stage === 'opened') && prediction && (
              <button
                ref={paperButtonRef}
                className={`${styles.paper} ${
                  stage === 'opened' ? styles.paperOpened : styles.paperReady
                }`}
                type="button"
                aria-label={
                  stage === 'ready' ? 'Открыть предсказание' : prediction.title
                }
                aria-expanded={stage === 'opened'}
                onClick={() => {
                  if (stage === 'ready') {
                    setStage('opened');
                  }
                }}
              >
                <span className={styles.paperHint}>
                  Нажми, чтобы развернуть
                </span>
                <span className={styles.predictionContent}>
                  <strong>{prediction.title}</strong>
                  <span>{prediction.text}</span>
                </span>
                <small className={styles.predictionDisclaimer}>
                  Это развлекательное предсказание, а не обещание результата.
                </small>
              </button>
            )}

            {stage === 'error' && (
              <div className={styles.errorCard} role="alert">
                <strong>Печенье сегодня упрямится</strong>
                <span>
                  {errorMessage ?? 'Не удалось получить предсказание.'}
                </span>
                <button type="button" onClick={startCracking}>
                  Попробовать ещё раз
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
