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

function copyTextFallback(value: string): boolean {
  if (typeof document.execCommand !== 'function') {
    return false;
  }

  const activeElement = document.activeElement;
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.width = '1px';
  textarea.style.height = '1px';
  textarea.style.opacity = '0';

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, value.length);

  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textarea.remove();
    if (activeElement instanceof HTMLElement) {
      activeElement.focus();
    }
  }
}

async function copyText(value: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall back for HTTP deployments and restrictive browser policies.
    }
  }

  return copyTextFallback(value);
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
      const copied = await copyText(absoluteUrl);
      onCopied(copied ? 'Ссылка скопирована' : absoluteUrl);
    } catch (error) {
      onError(getApiErrorMessage(error));
    }
  }, [createShare, onCopied, onError, userId]);

  return {
    shareRecap,
    isSharing: isLoading,
  };
}
