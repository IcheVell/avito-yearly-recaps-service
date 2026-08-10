import { CARD_VARIANTS, type CardVariant } from './cardVariants';

function createSeed(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function nextRandom(seed: number): number {
  return (seed * 1_664_525 + 1_013_904_223) >>> 0;
}

export function createCardVariants(
  seedValue: string,
  count: number,
): CardVariant[] {
  const shuffled = [...CARD_VARIANTS];
  let seed = createSeed(seedValue);

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    seed = nextRandom(seed);
    const randomIndex = seed % (index + 1);

    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return Array.from(
    { length: count },
    (_, index) => shuffled[index % shuffled.length],
  );
}
