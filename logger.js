const logs = [];

function addLog(level, ...args) {
    const timestamp = new Date().toISOString();
    // Convert all arguments to string, handling objects
    const message = args.map(arg => {
        if (arg instanceof Error) {
            return `Error: ${arg.message}\n${arg.stack}`;
        }
        if (typeof arg === 'object' && arg !== null) {
            return JSON.stringify(arg, null, 2);
        }
        return String(arg);
    }).join(' ');

    logs.push({ timestamp, level, message });
    
    // Also log to browser console for live debugging
    const consoleMethod = level.toLowerCase();
    if(console[consoleMethod]) {
        console[consoleMethod](`[${timestamp}] [${level}]`, ...args);
    } else {
        console.log(`[${timestamp}] [${level}]`, ...args);
    }
}

export const logger = {
    info: (...args) => addLog('INFO', ...args),
    warn: (...args) => addLog('WARN', ...args),
    error: (...args) => addLog('ERROR', ...args),
    getLogsAsString: () => {
        return logs.map(log => `[${log.timestamp}] [${log.level}] ${log.message}`).join('\n\n');
    },
    clear: () => {
        logs.length = 0;
    }
};

export async function withRetry(fn, { retries = 3, delay = 2000, onRetry } = {}) {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const currentAttempt = i + 1;
            const nextDelay = delay * Math.pow(2, i);
            
            logger.warn(`Attempt ${currentAttempt} failed. Retrying in ${nextDelay / 1000}s...`, error);
            
            if (onRetry) {
                onRetry(currentAttempt, retries, error);
            }
            
            await new Promise(resolve => setTimeout(resolve, nextDelay));
        }
    }
    logger.error(`All ${retries} retries failed.`, lastError);
    throw lastError;
}