
/**
 * Calculates an expiry date for a short URL.
 *
 * @param expiryDays - Number of days from now until expiry
 * @param expiryDateInput - Optional explicit expiry date (string or Date)
 * @returns Date | null  → null means "no expiry"
 * @throws Error if expiryDateInput is invalid or in the past
 */
export function getExpiryDate(
  expiryDays?: number,
  expiryDateInput?: string | Date
): Date | null {
  // Case 1: expiryDays provided and valid
  if (typeof expiryDays === "number" && expiryDays > 0) {
    return new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
  }

  // Case 2: explicit expiry date provided
  if (expiryDateInput) {
    const dt = new Date(expiryDateInput);
    if (isNaN(dt.getTime())) {
      throw new Error("Invalid expiryDate format");
    }
    if (dt <= new Date()) {
      throw new Error("expiryDate must be in the future");
    }
    return dt;
  }

  // Case 3: no expiry → return null
  return null;
}