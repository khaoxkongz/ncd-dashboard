export function cleanNumberString(str: string) {
  if (!str || str === "NaN") {
    return 0;
  }

  // Remove commas and convert to number
  const num = Number.parseFloat(str.replace(/,/g, ""));

  // Handle NaN after conversion
  if (Number.isNaN(num)) {
    return 0;
  }

  // Round to 2 decimal places
  return Math.round(num * 100) / 100;
}
