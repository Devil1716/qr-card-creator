/**
 * Production-safe logging utility
 * Only logs in development mode to avoid performance issues in production
 */

const isDevelopment = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args) => {
    // Always log errors, but can be enhanced with error tracking service
    if (isDevelopment) {
      console.error(...args);
    } else {
      // In production, you can send errors to a tracking service like Sentry
      // Example: Sentry.captureException(new Error(args.join(' ')));
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};

export default logger;

