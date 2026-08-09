import { AchievementCard } from '../../entities/recap/AchievementCard';
import { ActionCard } from '../../entities/recap/ActionCard';
import type { CardVariant } from '../../entities/recap/cardVariants';
import { IntroCard } from '../../entities/recap/IntroCard';
import { MetricCard } from '../../entities/recap/MetricCard';
import { RoleCard } from '../../entities/recap/RoleCard';
import type { RecapAction } from '../../entities/recap/types';

import type { RecapSlide } from './model/recapSlides';

type RecapSlideViewProps = {
  slide: RecapSlide;
  variant: CardVariant;
  isActive: boolean;
  onAction: (action: RecapAction) => void;
};

function assertNever(value: never): never {
  throw new Error(`Неизвестный тип recap-слайда: ${JSON.stringify(value)}`);
}

export function RecapSlideView({
  slide,
  variant,
  isActive,
  onAction,
}: RecapSlideViewProps) {
  switch (slide.kind) {
    case 'intro':
      return (
        <IntroCard year={slide.year} variant={variant} isActive={isActive} />
      );

    case 'role':
      return (
        <RoleCard role={slide.role} variant={variant} isActive={isActive} />
      );

    case 'metric':
      return (
        <MetricCard
          metric={slide.metric}
          variant={variant}
          isActive={isActive}
        />
      );

    case 'achievement':
      return (
        <AchievementCard
          achievement={slide.achievement}
          variant={variant}
          isActive={isActive}
        />
      );

    case 'action':
      return (
        <ActionCard
          action={slide.action}
          variant={variant}
          isActive={isActive}
          onAction={onAction}
        />
      );

    default:
      return assertNever(slide);
  }
}
