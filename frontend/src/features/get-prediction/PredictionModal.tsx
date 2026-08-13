import type { Prediction } from '../../entities/prediction/types';
import { Modal } from '../../shared/ui/Modal/Modal';

import styles from './PredictionModal.module.css';

type PredictionModalProps = {
  prediction: Prediction;
  onClose: () => void;
};

export function PredictionModal({ prediction, onClose }: PredictionModalProps) {
  return (
    <Modal title={prediction.title} onClose={onClose}>
      <p className={styles.content}>{prediction.text}</p>
      <p className={styles.note}>
        Это лёгкое развлекательное предсказание, а не обещание результата.
      </p>
    </Modal>
  );
}
