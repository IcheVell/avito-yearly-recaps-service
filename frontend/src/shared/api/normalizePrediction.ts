import type { Prediction } from '../../entities/prediction/types';

import { isRecord, readInteger, readString } from './runtimeDto';

export function normalizePredictionResponse(value: unknown): Prediction {
  const dto = isRecord(value) ? value : {};

  return {
    userId: readInteger(dto, 'userId') ?? 0,
    year: readInteger(dto, 'year') ?? 0,
    title: readString(dto, 'title') ?? '',
    text: readString(dto, 'text') ?? '',
    type: 'fortune',
  };
}
