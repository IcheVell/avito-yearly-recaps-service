const numberFormatter = new Intl.NumberFormat('ru-RU');
const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatCurrency(value: number | null): string {
  return value === null ? 'Нет данных' : currencyFormatter.format(value);
}

export function formatRegistrationDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'Дата неизвестна'
    : dateFormatter.format(date);
}
