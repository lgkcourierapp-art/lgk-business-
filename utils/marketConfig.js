export function formatCurrency(amount, currency = 'PLN') {
  const num = Number(amount) || 0;
  return currency + ' ' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
