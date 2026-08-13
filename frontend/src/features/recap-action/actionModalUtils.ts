export type ActionModalProps<TAction> = {
  action: TAction;
  onClose: () => void;
};

export const DEMO_NOTE =
  'Форма демонстрационная: действие ничего не отправляет.';

export function formatCategory(
  categoryName: string | null | undefined,
): string {
  return categoryName?.trim() || '—';
}
