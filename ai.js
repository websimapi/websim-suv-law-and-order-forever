import { logger, withRetry } from './logger.js';
import { updateLoadingMessage } from './ui.js';

const SCRIPT_STRUCTURE_PROMPT = `
You are a TV scriptwriter for the show "SUV: Law and Order Forever". Your task is to generate a complete, short episode script based on a theme.

Respond with ONLY a JSON object that follows this exact schema, with no other text or explanations.

The JSON schema is:
{
  "title": "string (A classic 'Law and Order' style episode title)",
  "characters": [
    {
      "name": "string (e.g., 'Detective Benson', 'Dr. Warner')",
      "description": "string (A detailed visual description for AI image generation. Include gender, appearance, and clothing. e.g., 'A compassionate female detective in her 40s with brown hair, wearing a professional pantsuit.')",
      "voice": "string ('en-male' or 'en-female')"
    }
  ],
  "scenes": [
    {
      "scene": "number (starting from 1)",
      "setting_description": "string (A detailed description of the scene's location and mood for AI image generation. e.g., 'A dimly lit, messy artist's loft in downtown Manhattan at night, dust motes visible in a single beam of light.')",
      "dialogue": [
        {
          "character": "string (Must match a name from the characters list)",
          "line": "string (A single line of dialogue for this character.)",
          "action": "string (A simple, one-word action from this list: 'enter', 'exit', 'normal', 'point'. 'normal' is default.)"
        }
      ]
    }
  ]
}

- Ensure all character names in 'dialogue' sections exist in the top-level 'characters' array.
- Create 2-4 characters.
- Create 3-5 scenes.
- Each scene should have 2-4 lines of dialogue.
- Make the plot a simple crime investigation.
`;

function createRetryHandler(baseMessage) {
    return (attempt, retries) => {
        updateLoadingMessage(`${baseMessage} (attempt ${attempt} of ${retries})`);
    };
}

export async function generateFullShowScript() {
    return withRetry(async () => {
        logger.info('Requesting script generation...');
        const completion = await websim.chat.completions.create({
            messages: [
                { role: "system", content: SCRIPT_STRUCTURE_PROMPT },
                { role: "user", content: "A case involving a stolen piece of art from a gallery." }
            ],
            json: true,
        });
        logger.info('Script generation successful.');
        return JSON.parse(completion.content);
    }, { onRetry: createRetryHandler('Generating script...') });
}

export async function generateCharacterImages(characters) {
    logger.info('Requesting character image generation for:', characters.map(c => c.name));
    const imageUrls = {};
    const imagePromises = characters.map(async (character) => {
        const result = await withRetry(() => websim.imageGen({
            prompt: `${character.description}, full body portrait, photorealistic, standing, facing forward, on a plain background`,
            transparent: true,
            aspect_ratio: "2:3"
        }), { onRetry: createRetryHandler(`Generating portrait for ${character.name}...`) });
        imageUrls[character.name] = result.url;
        logger.info(`Generated image for ${character.name}:`, result.url);
    });
    await Promise.all(imagePromises);
    logger.info('All character images generated.');
    return imageUrls;
}

export async function generateSceneImages(scenes) {
    logger.info('Requesting scene image generation for', scenes.length, 'scenes.');
    const imageUrls = {};
    const imagePromises = scenes.map(async (scene) => {
        const result = await withRetry(() => websim.imageGen({
            prompt: `${scene.setting_description}, no people, empty background, cinematic, dramatic lighting, photorealistic, wide angle shot`,
            aspect_ratio: "16:9"
        }), { onRetry: createRetryHandler(`Generating background for Scene ${scene.scene}...`) });
        imageUrls[scene.scene] = result.url;
        logger.info(`Generated image for Scene ${scene.scene}:`, result.url);
    });
    await Promise.all(imagePromises);
    logger.info('All scene images generated.');
    return imageUrls;
}

export async function generateAllDialogueAudio(script) {
    logger.info('Requesting dialogue audio generation...');
    const audioUrls = {};
    const dialogueLines = [];
    
    // Create a unique key for each line to store its URL
    script.scenes.forEach(scene => {
        scene.dialogue.forEach((line, index) => {
            const key = `scene-${scene.scene}-line-${index}`;
            dialogueLines.push({ ...line, key });
        });
    });

    const audioPromises = dialogueLines.map(async (line) => {
        const characterInfo = script.characters.find(c => c.name === line.character);
        if (!characterInfo) {
            logger.error(`Character "${line.character}" not found in character list for dialogue generation.`);
            return;
        }
        const voice = characterInfo.voice || 'en-male';

        const result = await withRetry(() => websim.textToSpeech({
            text: line.line,
            voice: voice,
        }), { onRetry: createRetryHandler(`Generating audio for ${line.character}...`) });
        
        audioUrls[line.key] = result.url;
        logger.info(`Generated audio for key ${line.key}`);
    });

    await Promise.all(audioPromises);
    logger.info('All dialogue audio generated.');
    return audioUrls;
}