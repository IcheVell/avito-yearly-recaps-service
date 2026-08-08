import type { Profile } from '../../entities/profile/types';

import { ProfileAvatar } from './ProfileAvatar';
import styles from './ProfilePage.module.css';

type ProfileListProps = {
  profiles: Profile[];
  selectedProfileId: number;
  onSelect: (profileId: number) => void;
};

export function ProfileList({
  profiles,
  selectedProfileId,
  onSelect,
}: ProfileListProps) {
  return (
    <div className={styles.profileList}>
      {profiles.map((profile) => {
        const isSelected = profile.id === selectedProfileId;

        return (
          <button
            key={profile.id}
            className={`${styles.profileCard} ${
              isSelected ? styles.profileCardSelected : ''
            }`}
            type="button"
            onClick={() => onSelect(profile.id)}
            aria-pressed={isSelected}
          >
            <ProfileAvatar profile={profile} size={64} />
            <span
              className={styles.profileName}
              title={profile.username}
            >
              {profile.username}
            </span>
          </button>
        );
      })}
    </div>
  );
}
