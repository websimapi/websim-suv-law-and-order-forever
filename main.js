import * as ai from './ai.js';
import * as show from './show.js';
import * as ui from './ui.js';

const startButton = document.getElementById('start-button');
const introScreen = document.getElementById('intro-screen');
const showContainer = document.getElementById('show-container');

async function generateAndPlayShow() {
    introScreen.classList.add('hidden');
    ui.showLoading('Generating script...');

    try {
        const scriptData = await ai.generateFullShowScript();
        console.log("Generated Script:", scriptData);

        ui.updateLoadingMessage('Generating character portraits...');
        const characterImageUrls = await ai.generateCharacterImages(scriptData.characters);
        console.log("Character Images:", characterImageUrls);

        ui.updateLoadingMessage('Generating scene backgrounds...');
        const sceneImageUrls = await ai.generateSceneImages(scriptData.scenes);
        console.log("Scene Images:", sceneImageUrls);

        ui.updateLoadingMessage('Generating dialogue audio...');
        const dialogueAudioUrls = await ai.generateAllDialogueAudio(scriptData.scenes);
        console.log("Dialogue Audio:", dialogueAudioUrls);
        
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
        console.error("Failed to generate and play the show:", error);
        ui.hideLoading();
        introScreen.classList.remove('hidden');
        alert("Sorry, something went wrong during episode generation. Please try again.");
    }
}


startButton.addEventListener('click', generateAndPlayShow);

