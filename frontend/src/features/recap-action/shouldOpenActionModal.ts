import type { RecapAction } from '../../entities/recap/types';

/** All recommended actions open a modal. */
export function shouldOpenActionModal(action: RecapAction): boolean {
  void action;
  return true;
}
