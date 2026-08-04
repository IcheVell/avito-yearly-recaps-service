import type { Recap } from '../entities/recap/types';



// export type Metric = {
//     id: number;
//     title: string;
//     value: string;
//     text: string;
//     variant: MetricVariant;
// }

// export type Recap = {
//     year: number;
//     metrics: Metric[];
// }
export const mockRecap: Recap = {
    year: 2026,
    metrics: [
        {
      id: 1,
      title: 'Потраченная сумма',
      value: '48 500 ₽',
      text: 'Столько стоило твоё любопытство в этом году.',
      variant: 'red',
    }, 
   {
      id: 2,
      title: 'Твои объявления заметили',
      value: '48 500 000',
      text: 'Каждая тысяча искала хозяина. Вместе они нашли тебя.',
      variant: 'blue',
    },
    {
      id: 3,
      title: 'Объявления в избранном',
      value: '125',
      text: 'Столько раз пользователи захотели вернуться к твоим товарам.',
      variant: 'green',
    },
    {
      id: 4,
      title: 'Максимальный стрик',
      value: '125',
      text: 'Был момент, когда Авито стало привычкой.',
      variant: 'purple',
    }
  ],
};