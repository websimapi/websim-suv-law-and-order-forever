import * as ai from './ai.js';
import * as show from './show.js';
import * as ui from './ui.js';
import { logger } from './logger.js';

const startButton = document.getElementById('start-button');
const introScreen = document.getElementById('intro-screen');
const showContainer = document.getElementById('show-container');

async function generateAndPlayShow() {
    logger.clear();
    logger.info('Starting new episode generation.');
    introScreen.classList.add('hidden');
    ui.showLoading('Generating script...');

    try {
        const scriptData = await ai.generateFullShowScript();
        logger.info("Generated Script:", scriptData);

        ui.updateLoadingMessage('Generating character portraits...');
        const characterImageUrls = await ai.generateCharacterImages(scriptData.characters);
        logger.info("Character Images:", characterImageUrls);

        ui.updateLoadingMessage('Generating scene backgrounds...');
        const sceneImageUrls = await ai.generateSceneImages(scriptData.scenes);
        logger.info("Scene Images:", sceneImageUrls);

        ui.updateLoadingMessage('Generating dialogue audio...');
        const dialogueAudioUrls = await ai.generateAllDialogueAudio(scriptData);
        logger.info("Dialogue Audio:", dialogueAudioUrls);
        
        const showData = {
            script: scriptData,
            assets: {
                characters: characterImageUrls,
                scenes: sceneImageUrls,
                dialogue: dialogueAudioUrls,
            }
        };

        ui.hideLoading();
        showContainer.classList.remove('hidden');
        
        await show.play(showData);
        
        // When the show is over, go back to the intro screen
        showContainer.classList.add('hidden');
        introScreen.classList.remove('hidden');

    } catch (error) {
        logger.error("A critical error occurred in generateAndPlayShow:", error);
        ui.hideLoading();
        ui.showError("Sorry, something went wrong during episode generation. Please try again or copy the logs for support.", generateAndPlayShow);
    }
}


startButton.addEventListener('click', generateAndPlayShow);