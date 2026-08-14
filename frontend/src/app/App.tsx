import { ProfilePage } from '../pages/ProfilePage/ProfilePage';
import { ShareRecapPage } from '../pages/ShareRecapPage/ShareRecapPage';
import { getShareTokenFromPath } from '../pages/ShareRecapPage/getShareTokenFromPath';

export function App() {
  const shareToken = getShareTokenFromPath(window.location.pathname);

  if (shareToken) {
    return <ShareRecapPage token={shareToken} />;
  }

  return <ProfilePage />;
}
