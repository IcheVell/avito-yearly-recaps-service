export const CARD_VARIANTS = ['red', 'blue', 'green', 'purple'] as const;

export type CardVariant = (typeof CARD_VARIANTS)[number];
