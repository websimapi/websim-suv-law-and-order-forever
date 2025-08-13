import { logger } from './logger.js';

const loadingOverlay = document.getElementById('loading-overlay');
const loadingMessage = document.getElementById('loading-message');
const subtitlesContainer = document.getElementById('subtitles-container');
const errorOverlay = document.getElementById('error-overlay');
const errorMessageText = document.getElementById('error-message-text');
const errorRetryButton = document.getElementById('error-retry-button');
const errorCopyLogsButton = document.getElementById('error-copy-logs-button');

let onRetryCallback = null;

export function showLoading(message) {
    loadingMessage.textContent = message;
    loadingOverlay.classList.remove('hidden');
}

export function updateLoadingMessage(message) {
    loadingMessage.textContent = message;
}

export function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

export function showSubtitles(character, line) {
    subtitlesContainer.innerHTML = `<strong>${character}:</strong> ${line}`;
    subtitlesContainer.classList.add('visible');
}

export function hideSubtitles() {
     subtitlesContainer.classList.remove('visible');
}

export function showError(message, onRetry) {
    logger.error('Displaying error modal with message:', message);
    errorMessageText.textContent = message || "An unknown error occurred. Check the logs for more details.";
    onRetryCallback = onRetry;

    hideLoading();
    errorOverlay.classList.remove('hidden');
}

export function hideError() {
    errorOverlay.classList.add('hidden');
    onRetryCallback = null;
}

errorRetryButton.addEventListener('click', () => {
    if (onRetryCallback) {
        hideError();
        onRetryCallback();
    }
});

errorCopyLogsButton.addEventListener('click', () => {
    const logs = logger.getLogsAsString();
    navigator.clipboard.writeText(logs).then(() => {
        alert('Logs copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy logs to clipboard:', err);
        alert('Could not copy logs. Please open the browser console to view them.');
    });
});