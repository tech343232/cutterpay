export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
export const round8 = (n) => Math.round(n * 1e8) / 1e8;

export const usd = (n) =>
  '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const qtyText = (n) => String(+Number(n).toFixed(8));
