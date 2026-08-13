import type { Profile } from '../../entities/profile/types';
import type { Prediction } from '../../entities/prediction/types';
import type { Recap } from '../../entities/recap/types';
import { GenerateRecapButton } from '../../features/generate-recap/GenerateRecapButton';
import { GetPredictionButton } from '../../features/get-prediction/GetPredictionButton';
import { GetRecapButton } from '../../features/get-recap/GetRecapButton';

import { ProfileAvatar } from './ProfileAvatar';
import styles from './ProfilePage.module.css';

type ProfileSummaryProps = {
  profile: Profile;
  year: number;
  onRecapReceived: (recap: Recap) => void;
  onPredictionReceived: (prediction: Prediction) => void;
};

export function ProfileSummary({
  profile,
  year,
  onRecapReceived,
  onPredictionReceived,
}: ProfileSummaryProps) {
  return (
    <div className={styles.profileDetails}>
      <ProfileAvatar profile={profile} size={108} />

      <div>
        <p className={styles.eyebrow}>Текущий профиль</p>
        <h2>{profile.username}</h2>

        <div className={styles.recapButtons}>
          <GenerateRecapButton
            userId={profile.id}
            year={year}
            onGenerated={onRecapReceived}
          />

          <GetRecapButton userId={profile.id} onReceived={onRecapReceived} />

          <GetPredictionButton
            userId={profile.id}
            nextYear={year + 1}
            onReceived={onPredictionReceived}
          />
        </div>
      </div>
    </div>
  );
}
