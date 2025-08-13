import * as ui from './ui.js';
import { logger } from './logger.js';

const sceneContainer = document.getElementById('scene-container');
const characterContainer = document.getElementById('character-container');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function renderSceneBackground(sceneImageUrl) {
    sceneContainer.style.backgroundImage = `url(${sceneImageUrl})`;
    characterContainer.innerHTML = ''; // Clear previous characters
}

function renderCharacter(characterName, characterImageUrl) {
    const characterId = `char-${characterName.replace(/\s/g, '-')}`;
    let characterEl = document.getElementById(characterId);
    if (!characterEl) {
        characterEl = document.createElement('img');
        characterEl.id = characterId;
        characterEl.src = characterImageUrl;
        characterEl.className = 'character';
        characterEl.alt = characterName;
        characterContainer.appendChild(characterEl);
    }
    return characterEl;
}

function positionCharacters(characterNames, characterImageUrls) {
    const totalChars = characterNames.length;
    characterNames.forEach((name, index) => {
        const characterEl = renderCharacter(name, characterImageUrls[name]);
        
        // Distribute characters evenly across the screen
        const positionPercent = (index + 1) * (100 / (totalChars + 1));
        
        characterEl.style.left = `${positionPercent}%`;
        characterEl.style.transform = `translateX(-50%)`; // Center the element
    });
}

function setTalkingCharacter(characterName) {
    document.querySelectorAll('.character').forEach(el => {
        if (el.alt === characterName) {
            el.classList.add('talking');
        } else {
            el.classList.remove('talking');
        }
    });
}

function stopAllTalking() {
    document.querySelectorAll('.character.talking').forEach(el => {
        el.classList.remove('talking');
    });
}

async function playDialogue(dialogueLine, audioUrl) {
    return new Promise(async (resolve, reject) => {
        ui.showSubtitles(dialogueLine.character, dialogueLine.line);
        setTalkingCharacter(dialogueLine.character);
        
        const audio = new Audio(audioUrl);
        
        audio.onerror = (e) => {
            logger.error('Error playing audio:', audioUrl, e);
            stopAllTalking();
            ui.hideSubtitles();
            resolve(); 
        };
        
        audio.onended = () => {
            stopAllTalking();
            ui.hideSubtitles();
            resolve();
        };

        audio.play().catch(e => {
            logger.error('Audio play() promise rejected:', e);
            audio.onerror(e);
        });
    });
}

export async function play(showData) {
    logger.info('Starting show playback.');
    const { script, assets } = showData;

    for (const scene of script.scenes) {
        logger.info(`Playing Scene ${scene.scene}`);
        renderSceneBackground(assets.scenes[scene.scene]);
        
        const sceneCharacterNames = [...new Set(scene.dialogue.map(d => d.character))];
        positionCharacters(sceneCharacterNames, assets.characters);
        
        await sleep(2000); // Time for scene transition

        for (let i = 0; i < scene.dialogue.length; i++) {
            const line = scene.dialogue[i];
            const audioKey = `scene-${scene.scene}-line-${i}`;
            const audioUrl = assets.dialogue[audioKey];

            if (!audioUrl) {
                logger.warn(`Missing audio for key ${audioKey}. Skipping line.`);
                continue;
            }
            
            const characterId = `char-${line.character.replace(/\s/g, '-')}`;
            const characterEl = document.getElementById(characterId);

            if (!characterEl) {
                logger.warn(`Character element for ${line.character} not found in scene. Skipping line.`);
                continue;
            }

            // Simple animation
            if (line.action === 'enter') {
                characterEl.style.opacity = '0';
                await sleep(100);
                characterEl.style.opacity = '1';
            }

            await playDialogue(line, audioUrl);
            
             if (line.action === 'exit') {
                characterEl.style.opacity = '0';
                await sleep(1000);
                characterEl.remove();
            }

            await sleep(500); // Pause between lines
        }

        await sleep(2000); // Pause between scenes
    }
    
    logger.info('Show playback finished.');
    // End of show
    characterContainer.innerHTML = '';
    sceneContainer.style.backgroundImage = 'none';
}