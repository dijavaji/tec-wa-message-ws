import 'dotenv/config';

export const config = {
  port: process.env.PORT || 1234,
  logLevel: process.env.LOG_LEVEL || 'info',
  orchestratorUrl: process.env.ORCHESTRATOR_URL,
  sessionPath: process.env.SESSION_PATH || './storage',
  limitPagination: parseInt(process.env.LIMIT_PAGINATION) || 10,
  limitOffset: parseInt(process.env.LIMIT_OFFSET) || 0,
};

export default config;
