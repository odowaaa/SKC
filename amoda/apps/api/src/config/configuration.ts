export default () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:3000',

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },

  apple: {
    clientId: process.env.APPLE_CLIENT_ID,
    teamId: process.env.APPLE_TEAM_ID,
    keyId: process.env.APPLE_KEY_ID,
    privateKey: process.env.APPLE_PRIVATE_KEY,
  },

  facebook: {
    appId: process.env.FACEBOOK_APP_ID,
    appSecret: process.env.FACEBOOK_APP_SECRET,
  },

  mail: {
    host: process.env.SMTP_HOST ?? 'localhost',
    port: parseInt(process.env.SMTP_PORT ?? '1025', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM ?? 'AMODA <no-reply@amoda.app>',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    apiBaseUrl:
      process.env.PAYPAL_API_BASE_URL ?? 'https://api-m.sandbox.paypal.com',
  },

  waafiPay: {
    apiBaseUrl:
      process.env.WAAFIPAY_API_BASE_URL ?? 'https://api.waafipay.net/asm',
    hormuudEvc: {
      merchantUid: process.env.HORMUUD_EVC_MERCHANT_UID,
      apiUserId: process.env.HORMUUD_EVC_API_USER_ID,
      apiKey: process.env.HORMUUD_EVC_API_KEY,
    },
    zaad: {
      merchantUid: process.env.ZAAD_MERCHANT_UID,
      apiUserId: process.env.ZAAD_API_USER_ID,
      apiKey: process.env.ZAAD_API_KEY,
    },
    sahal: {
      merchantUid: process.env.SAHAL_MERCHANT_UID,
      apiUserId: process.env.SAHAL_API_USER_ID,
      apiKey: process.env.SAHAL_API_KEY,
    },
    premierWallet: {
      merchantUid: process.env.PREMIER_WALLET_MERCHANT_UID,
      apiUserId: process.env.PREMIER_WALLET_API_USER_ID,
      apiKey: process.env.PREMIER_WALLET_API_KEY,
    },
  },

  sms: {
    accountSid: process.env.SMS_ACCOUNT_SID,
    authToken: process.env.SMS_AUTH_TOKEN,
    fromNumber: process.env.SMS_FROM_NUMBER,
  },

  whatsapp: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  },

  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },

  throttle: {
    ttlSeconds: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },
});
