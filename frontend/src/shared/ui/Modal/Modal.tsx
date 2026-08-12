import type { PropsWithChildren, ReactNode } from 'react';
import { useEffect, useId, useRef } from 'react';

import styles from './Modal.module.css';

type ModalProps = PropsWithChildren<{
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  wide?: boolean;
}>;

export function Modal({
  title,
  onClose,
  footer,
  wide = false,
  children,
}: ModalProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  return (
    <div className={styles.root} role="presentation">
      <button
        className={styles.backdrop}
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
      />

      <div
        className={`${styles.dialog} ${wide ? styles.dialogWide : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            className={styles.closeButton}
            type="button"
            aria-label="Закрыть окно"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className={styles.body}>{children}</div>

        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>
  );
}
