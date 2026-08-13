import { useCallback } from 'react';

import { getApiErrorMessage } from '../../../shared/api/apiError';
import { useCreateShareRecapMutation } from '../../../shared/api/shareRecapApi';
import { toAppUrl } from '../../../shared/lib/appUrl';

type UseShareRecapOptions = {
  userId: number;
  onCopied: (message: string) => void;
  onError: (message: string) => void;
};

type UseShareRecapResult = {
  shareRecap: () => Promise<void>;
  isSharing: boolean;
};

export function toAbsoluteShareUrl(shareUrl: string): string {
  return toAppUrl(shareUrl);
}

async function copyText(value: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export function useShareRecap({
  userId,
  onCopied,
  onError,
}: UseShareRecapOptions): UseShareRecapResult {
  const [createShare, { isLoading }] = useCreateShareRecapMutation();

  const shareRecap = useCallback(async () => {
    try {
      const { shareUrl } = await createShare(userId).unwrap();
      if (!shareUrl) {
        onError('Не удалось создать ссылку.');
        return;
      }

      const absoluteUrl = toAbsoluteShareUrl(shareUrl);
      await copyText(absoluteUrl);
      onCopied('Ссылка скопирована');
    } catch (error) {
      onError(getApiErrorMessage(error));
    }
  }, [createShare, onCopied, onError, userId]);

  return {
    shareRecap,
    isSharing: isLoading,
  };
}
