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

export async function generateFullShowScript() {
    const completion = await websim.chat.completions.create({
        messages: [
            { role: "system", content: SCRIPT_STRUCTURE_PROMPT },
            { role: "user", content: "A case involving a stolen piece of art from a gallery." }
        ],
        json: true,
    });
    return JSON.parse(completion.content);
}

export async function generateCharacterImages(characters) {
    const imageUrls = {};
    const imagePromises = characters.map(async (character) => {
        const result = await websim.imageGen({
            prompt: `${character.description}, full body portrait, photorealistic, standing, facing forward, on a plain background`,
            transparent: true,
            aspect_ratio: "2:3"
        });
        imageUrls[character.name] = result.url;
    });
    await Promise.all(imagePromises);
    return imageUrls;
}

export async function generateSceneImages(scenes) {
    const imageUrls = {};
    const imagePromises = scenes.map(async (scene) => {
        const result = await websim.imageGen({
            prompt: `${scene.setting_description}, cinematic, dramatic lighting, photorealistic, wide angle shot`,
            aspect_ratio: "16:9"
        });
        imageUrls[scene.scene] = result.url;
    });
    await Promise.all(imagePromises);
    return imageUrls;
}

export async function generateAllDialogueAudio(scenes) {
    const audioUrls = {};
    const dialogueLines = [];
    
    // Create a unique key for each line to store its URL
    scenes.forEach(scene => {
        scene.dialogue.forEach((line, index) => {
            const key = `scene-${scene.scene}-line-${index}`;
            dialogueLines.push({ ...line, key });
        });
    });

    const audioPromises = dialogueLines.map(async (line) => {
         // Find character to get the voice
        const character = scenes.flatMap(s => s.dialogue.map(d => d.character))
                                 .find((c, i, arr) => arr.findIndex(t => t === c) === i); // Not ideal way to get character list but works for this scope
        const script = await generateFullShowScript();
        const characterInfo = script.characters.find(c => c.name === line.character);
        const voice = characterInfo ? characterInfo.voice : 'en-male'; // Default voice

        const result = await websim.textToSpeech({
            text: line.line,
            voice: voice,
        });
        audioUrls[line.key] = result.url;
    });

    await Promise.all(audioPromises);
    return audioUrls;
}

