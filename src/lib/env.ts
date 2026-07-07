const env = {
  DB_PATH: process.env.DB_PATH || './data/crm.db',
  JWT_SECRET: process.env.JWT_SECRET || 'crm-local-dev-secret-change-in-production',
  COOKIE_NAME: 'crm_token',
} as const;

export default env;
