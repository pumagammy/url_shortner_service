
import { ulid } from "ulid";

/**
 * Generates a full ULID and a 6-char shortCode derived from it.
 *  - ulid: globally unique (time + randomness)
 *  - shortCode: last 6 chars of ULID (you can choose first 6 if you prefer)
 */
export const generateUniqueIdAndShortCode = () => {
  const id = ulid(); 
  const shortCode = id.slice(-6); 

  return { ulidId: id, shortCode };
};

