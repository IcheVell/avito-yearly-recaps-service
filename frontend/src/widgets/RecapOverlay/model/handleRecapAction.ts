import type { RecapAction } from '../../../entities/recap/types';

import { shouldOpenActionModal } from '../../../features/recap-action/shouldOpenActionModal';

export type RecapActionHandlerResult =
  | { kind: 'modal'; action: RecapAction }
  | { kind: 'none' };

export function handleRecapAction(
  action: RecapAction,
): RecapActionHandlerResult {
  if (shouldOpenActionModal(action)) {
    return { kind: 'modal', action };
  }

  return { kind: 'none' };
}
