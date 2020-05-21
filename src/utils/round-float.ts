export const roundFloat = (value: number, maxDecimals = 6) =>
  parseFloat(value.toFixed(maxDecimals))
