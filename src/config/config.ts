import dotenv from "dotenv";
dotenv.config();

export default {
  tokenSecret: process.env.TOKEN_SECRET || "fallback_secret_key",
  tokenExpiration: process.env.TOKEN_EXPIRATION || "3600s",
  refreshTokenExpiration: process.env.REFRESH_TOKEN_EXPIRATION || "7d",
};
