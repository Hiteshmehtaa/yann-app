/**
 * Logger Utility
 * 
 * Provides conditional logging that only works in development mode.
 * Replaces console.log statements throughout the app.
 */

const isDev = __DEV__;

export const logger = {
    /**
     * Log general information
     */
    log: (...args: any[]) => {
        if (isDev) {
            console.log('[LOG]', ...args);
        }
    },

    /**
     * Log informational messages
     */
    info: (...args: any[]) => {
        if (isDev) {
            console.info('[INFO]', ...args);
        }
    },

    /**
     * Log warnings
     */
    warn: (...args: any[]) => {
        if (isDev) {
            console.warn('[WARN]', ...args);
        }
    },

    /**
     * Log errors (always logged, even in production for error tracking)
     */
    error: (...args: any[]) => {
        console.error('[ERROR]', ...args);
        // In production, you would send this to an error tracking service
        // Example: Sentry.captureException(args[0]);
    },

    /**
     * Log debug information (only in dev)
     */
    debug: (...args: any[]) => {
        if (isDev) {
            console.debug('[DEBUG]', ...args);
        }
    },

    /**
     * Log API requests
     */
    api: (method: string, url: string, data?: any) => {
        if (isDev) {
            console.log(`[API] ${method} ${url}`, data || '');
        }
    },

    /**
     * Log navigation events
     */
    navigation: (screen: string, params?: any) => {
        if (isDev) {
            console.log(`[NAV] → ${screen}`, params || '');
        }
    },

    /**
     * Log user actions
     */
    action: (action: string, data?: any) => {
        if (isDev) {
            console.log(`[ACTION] ${action}`, data || '');
        }
    },
};

// Export individual functions for convenience
export const { log, info, warn, error, debug, api, navigation, action } = logger;

export default logger;
