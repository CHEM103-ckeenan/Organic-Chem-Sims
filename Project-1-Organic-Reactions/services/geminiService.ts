import { GoogleGenAI } from "@google/genai";

// We assume the key is provided via the environment or selected via AI Studio
// Per instructions, we must assume window.aistudio handles key selection for Veo specifically,
// but usually we need to pass a key to GoogleGenAI constructor.
// If window.aistudio.openSelectKey() is used, the key is typically injected into process.env.API_KEY or handled by proxy.
// However, the instructions state: "The selected API key is available via process.env.API_KEY. It is injected automatically."

export const generateVeoVideo = async (
  imageFile: File,
  prompt: string,
  aspectRatio: '16:9' | '9:16',
  setLoadingMessage: (msg: string) => void
): Promise<string> => {
  
  // 1. Ensure API Key is selected
  try {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
       // This should trigger the UI flow in the component, but if we are here, we might need to force it.
       // However, the component handles the button. This function assumes key is ready.
       // We can re-check or just proceed.
       // If logic strictly follows prompt: component checks `hasSelectedApiKey`, then calls `openSelectKey`.
       // Once that is done, we call this function.
    }
  } catch (e) {
    console.warn("AI Studio Check failed, proceeding assuming env key might exist or dev mode", e);
  }

  // 2. Initialize Client
  // CRITICAL: Create new instance right before call as per instructions
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 3. Convert Image to Base64
  const base64Image = await fileToBase64(imageFile);

  // 4. Start Generation
  setLoadingMessage("Initiating Veo generation (this may take a moment)...");
  
  let operation;
  try {
    operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || "Animate this image cinematically", // Prompt is optional but recommended
        image: {
            imageBytes: base64Image,
            mimeType: imageFile.type,
        },
        config: {
            numberOfVideos: 1,
            // resolution: '720p', // fast-generate-preview might default/enforce specific res
            // 'fast-generate-preview' usually supports 720p or similar.
            // Documentation implies we can set it.
            aspectRatio: aspectRatio
        }
    });
  } catch (error: any) {
    // Graceful error handling for key not found
    if (error.message?.includes("Requested entity was not found")) {
        throw new Error("API Key Error: Please re-select your API key.");
    }
    throw error;
  }

  // 5. Poll for completion
  setLoadingMessage("Rendering video...");
  
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
    operation = await ai.operations.getVideosOperation({ operation: operation });
    setLoadingMessage("Rendering video... " + (operation.metadata?.progress || "processing"));
  }

  // 6. Retrieve Result
  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) {
    throw new Error("No video URI returned from generation.");
  }

  // 7. Fetch the actual video blob (requires key appended)
  // Note: The prompt instruction says: "const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);"
  setLoadingMessage("Downloading video...");
  const videoFetchResponse = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
  
  if (!videoFetchResponse.ok) {
    throw new Error("Failed to download generated video file.");
  }

  const videoBlob = await videoFetchResponse.blob();
  return URL.createObjectURL(videoBlob);
};

// Helper for Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};
