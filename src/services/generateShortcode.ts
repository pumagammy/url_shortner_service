
import crypto from 'crypto';
export const generateShortCode = (): string => {
    return crypto.randomBytes(4).toString('hex');
}
 