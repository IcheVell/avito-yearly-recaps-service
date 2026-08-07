import type { Profile } from '../../entities/profile/types';

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
            <img
              src={profile.imageUrl}
              alt=""
              width="64"
              height="64"
            />
            <span title={profile.username}>{profile.username}</span>
          </button>
        );
      })}
    </div>
  );
}
