import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

export const generateTokens = (userId: string) => {
  const jti = randomUUID();

  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET as string, {
    expiresIn: '15m',
  });

  const refreshToken = jwt.sign({ userId, jti }, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: '7d',
  });

  return { accessToken, refreshToken, jti };
};
