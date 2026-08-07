import type { Achievement } from '../../../entities/achievement/types';
import type {
  Recap,
  RecapAction,
  RecapMetric,
  RecapRole,
} from '../../../entities/recap/types';

export type RecapSlide =
  | {
      id: 'intro';
      kind: 'intro';
      year: number;
    }
  | {
      id: 'role';
      kind: 'role';
      role: RecapRole;
    }
  | {
      id: string;
      kind: 'metric';
      metric: RecapMetric;
    }
  | {
      id: string;
      kind: 'achievement';
      achievement: Achievement;
    }
  | {
      id: 'action';
      kind: 'action';
      action: RecapAction;
    };

export function createRecapSlides(
  recap: Recap,
): RecapSlide[] {
  const metricSlides: RecapSlide[] = recap.metrics.map(
    (metric, index) => ({
      id: `metric-${metric.type}-${index}`,
      kind: 'metric',
      metric,
    }),
  );

  const achievementSlides: RecapSlide[] =
    recap.achievements.map((achievement, index) => ({
      id: `achievement-${achievement.code}-${index}`,
      kind: 'achievement',
      achievement,
    }));

  return [
    {
      id: 'intro',
      kind: 'intro',
      year: recap.year,
    },
    {
      id: 'role',
      kind: 'role',
      role: recap.role,
    },
    ...metricSlides,
    ...achievementSlides,
    {
      id: 'action',
      kind: 'action',
      action: recap.action,
    },
  ];
}
