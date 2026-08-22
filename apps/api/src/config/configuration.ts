export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  database: {
    url: process.env.DATABASE_URL || '',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    name: process.env.DATABASE_NAME || 'quorum',
    user: process.env.DATABASE_USER || 'quorum',
    password: process.env.DATABASE_PASSWORD || 'quorum_dev',
    iamAuth: process.env.DATABASE_IAM_AUTH === 'true',
    region: process.env.AWS_REGION || 'eu-north-1',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev-secret-change-me'),
    expiration: process.env.JWT_EXPIRATION || '7d',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3001/auth/google/callback',
  },

  livekit: {
    apiKey: process.env.LIVEKIT_API_KEY || '',
    apiSecret: process.env.LIVEKIT_API_SECRET || '',
    url: process.env.LIVEKIT_URL || '',
    s3AccessKey: process.env.S3_ACCESS_KEY_ID || '',
    s3SecretKey: process.env.S3_SECRET_ACCESS_KEY || '',
    s3Region: process.env.S3_REGION || 'us-east-1',
    s3Bucket: process.env.S3_BUCKET || '',
  },

  internalApiKey: process.env.INTERNAL_API_KEY || '',
});

