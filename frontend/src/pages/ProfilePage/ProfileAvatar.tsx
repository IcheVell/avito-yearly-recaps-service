import type { Profile } from '../../entities/profile/types';
import { SafeImage } from '../../shared/ui/SafeImage/SafeImage';

import styles from './ProfilePage.module.css';

type ProfileAvatarProps = {
  profile: Profile;
  size: number;
};

function getInitials(username: string): string {
  return username
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function ProfileAvatar({ profile, size }: ProfileAvatarProps) {
  return (
    <SafeImage
      src={profile.imageUrl}
      alt=""
      width={size}
      height={size}
      fallback={
        <span
          className={styles.profileAvatarFallback}
          style={{ width: size, height: size }}
          aria-hidden="true"
        >
          {getInitials(profile.username) || '•'}
        </span>
      }
    />
  );
}
