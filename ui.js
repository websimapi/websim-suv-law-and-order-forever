const loadingOverlay = document.getElementById('loading-overlay');
const loadingMessage = document.getElementById('loading-message');
const subtitlesContainer = document.getElementById('subtitles-container');

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

