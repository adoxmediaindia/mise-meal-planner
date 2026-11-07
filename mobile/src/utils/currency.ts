import { CurrencyCode } from '../types';

export const formatCurrency = (
  amount: number,
  currencyCode: CurrencyCode = 'USD'
): string =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
