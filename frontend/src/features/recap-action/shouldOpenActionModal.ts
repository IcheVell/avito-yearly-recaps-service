import type { RecapAction } from '../../entities/recap/types';

/** All recommended actions open a modal; some modals also offer Avito links. */
export function shouldOpenActionModal(_action: RecapAction): boolean {
  return true;
}
