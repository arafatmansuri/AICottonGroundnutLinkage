import dotenv from 'dotenv';
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  granite: {
    apiKey: string;
    endpoint: string;
    model: string;
    projectId: string;
  };
  marketData: {
    provider: 'MOCK' | 'REAL';
    apiUrl: string;
    apiKey: string;
  };
  ai: {
    provider: 'MOCK' | 'GRANITE';
  };
  upload: {
    dir: string;
    maxSizeMb: number;
  };
  cors: {
    origin: string;
  };
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    uploadFolder: string;
  };
}

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

const config: Config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: requireEnv('DATABASE_URL'),
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  granite: {
    apiKey: process.env.IBM_GRANITE_API_KEY || '',
    endpoint: process.env.IBM_GRANITE_ENDPOINT || 'https://us-south.ml.cloud.ibm.com',
    model: process.env.IBM_GRANITE_MODEL || 'ibm/granite-13b-instruct-v2',
    projectId: process.env.IBM_WATSONX_PROJECT_ID || '',
  },
  marketData: {
    provider: (process.env.MARKET_DATA_PROVIDER as 'MOCK' | 'REAL') || 'MOCK',
    apiUrl: process.env.MARKET_DATA_API_URL || '',
    apiKey: process.env.MARKET_DATA_API_KEY || '',
  },
  ai: {
    provider: (process.env.AI_PROVIDER as 'MOCK' | 'GRANITE') || 'MOCK',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    uploadFolder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'ailinkage/quality-checks',
  },
};

export default config;
