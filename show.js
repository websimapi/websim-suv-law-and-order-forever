import * as ui from './ui.js';

const sceneContainer = document.getElementById('scene-container');
const characterContainer = document.getElementById('character-container');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function renderScene(scene, sceneImageUrl) {
    sceneContainer.style.backgroundImage = `url(${sceneImageUrl})`;
    characterContainer.innerHTML = ''; // Clear previous characters
}

function renderCharacter(characterName, characterImageUrl, isTalking = false) {
    let characterEl = document.getElementById(`char-${characterName.replace(/\s/g, '-')}`);
    if (!characterEl) {
        characterEl = document.createElement('img');
        characterEl.id = `char-${characterName.replace(/\s/g, '-')}`;
        characterEl.src = characterImageUrl;
        characterEl.className = 'character';
        characterContainer.appendChild(characterEl);
        
        // Basic positioning logic
        const numChars = characterContainer.children.length;
        const position = 15 + (numChars - 1) * 30; // Spread characters out
        characterEl.style.left = `${position}%`;
        characterEl.style.transform = `translateX(-${position}%)`;
    }
    
    if (isTalking) {
        characterEl.classList.add('talking');
    } else {
        document.querySelectorAll('.character').forEach(c => c.classList.remove('talking'));
    }

    return characterEl;
}

async function playDialogue(dialogueLine, audioUrl, characterEl) {
    return new Promise(async (resolve) => {
        ui.showSubtitles(dialogueLine.character, dialogueLine.line);
        characterEl.classList.add('talking');
        
        const audio = new Audio(audioUrl);
        audio.play();
        
        audio.onended = () => {
            characterEl.classList.remove('talking');
            ui.hideSubtitles();
            resolve();
        };
    });
}

export async function play(showData) {
    const { script, assets } = showData;

    for (const scene of script.scenes) {
        renderScene(scene, assets.scenes[scene.scene]);
        
        // Pre-render characters in the scene
        const sceneCharacterNames = [...new Set(scene.dialogue.map(d => d.character))];
        sceneCharacterNames.forEach(name => {
            renderCharacter(name, assets.characters[name]);
        });
        
        await sleep(2000); // Time for scene transition

        for (let i = 0; i < scene.dialogue.length; i++) {
            const line = scene.dialogue[i];
            const audioKey = `scene-${scene.scene}-line-${i}`;
            const audioUrl = assets.dialogue[audioKey];
            const characterEl = renderCharacter(line.character, assets.characters[line.character], true);

            // Simple animation
            if (line.action === 'enter') {
                characterEl.style.opacity = '0';
                await sleep(100);
                characterEl.style.opacity = '1';
            }

            await playDialogue(line, audioUrl, characterEl);
            
             if (line.action === 'exit') {
                characterEl.style.opacity = '0';
                await sleep(1000);
                characterEl.remove();
            }

            await sleep(500); // Pause between lines
        }

        await sleep(2000); // Pause between scenes
    }
    
    // End of show
    characterContainer.innerHTML = '';
    sceneContainer.style.backgroundImage = 'none';
}

