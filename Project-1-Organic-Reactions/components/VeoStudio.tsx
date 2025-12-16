import React, { useState, useRef, useEffect } from 'react';
import { Upload, Film, Loader2, PlayCircle, Key, AlertCircle } from 'lucide-react';
import { generateVeoVideo } from '../services/geminiService';
import { AspectRatio } from '../types';

const VeoStudio: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.LANDSCAPE);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for API Key on mount
  useEffect(() => {
    const checkKey = async () => {
        try {
            if (window.aistudio && window.aistudio.hasSelectedApiKey) {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setApiKeyMissing(!hasKey);
            }
        } catch (e) {
            console.warn("AI Studio unavailable", e);
        }
    };
    checkKey();
  }, []);

  const handleKeySelection = async () => {
      try {
          if (window.aistudio && window.aistudio.openSelectKey) {
              await window.aistudio.openSelectKey();
              // Assume success as per instructions
              setApiKeyMissing(false);
              setError(null);
          }
      } catch (e) {
          setError("Failed to open key selection dialog.");
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setGeneratedVideoUrl(null); // Reset previous result
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    setError(null);
    setLoadingMessage("Preparing...");

    try {
      const videoUrl = await generateVeoVideo(selectedFile, prompt, aspectRatio, setLoadingMessage);
      setGeneratedVideoUrl(videoUrl);
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("API Key Error")) {
          setApiKeyMissing(true);
          setError(err.message);
      } else {
          setError("Video generation failed. Please try again. " + (err.message || ""));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                <Film className="w-8 h-8 text-indigo-600" />
                Veo Video Generator
            </h2>
            <p className="text-slate-500">Transform your static images into cinematic videos with Google's Veo 3.1 model.</p>
            
            {/* API Key Banner */}
            {apiKeyMissing && (
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-amber-600" />
                        <div className="text-sm">
                            <span className="text-amber-800 font-medium block">API Key Required</span>
                            <span className="text-amber-700/80">You need a paid API key to use Veo. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-amber-900">View Billing Docs</a>.</span>
                        </div>
                    </div>
                    <button 
                        onClick={handleKeySelection}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg text-sm transition-colors shadow-sm"
                    >
                        Select API Key
                    </button>
                </div>
            )}
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Inputs */}
            <div className="space-y-6">
                
                {/* File Upload */}
                <div 
                    className={`border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer transition-all ${
                        selectedFile ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                >
                    {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="h-full w-full object-contain rounded-lg p-2" />
                    ) : (
                        <div className="text-center p-6">
                            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                            <p className="text-slate-900 font-medium">Click to upload image</p>
                            <p className="text-slate-500 text-sm mt-1">PNG, JPG supported</p>
                        </div>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>

                {/* Controls */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Prompt (Optional)</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe how you want the image to move (e.g., 'Cinematic pan, slow motion water flow')..."
                            className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none h-24 placeholder:text-slate-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Aspect Ratio</label>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setAspectRatio(AspectRatio.LANDSCAPE)}
                                className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
                                    aspectRatio === AspectRatio.LANDSCAPE
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                16:9 Landscape
                            </button>
                            <button
                                onClick={() => setAspectRatio(AspectRatio.PORTRAIT)}
                                className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
                                    aspectRatio === AspectRatio.PORTRAIT
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                9:16 Portrait
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={!selectedFile || isLoading || apiKeyMissing}
                        className={`w-full py-3.5 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                            !selectedFile || isLoading || apiKeyMissing
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white shadow-lg shadow-indigo-200'
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <Film className="w-5 h-5" />
                                <span>Generate Video</span>
                            </>
                        )}
                    </button>
                    {error && (
                        <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Output */}
            <div className="flex flex-col h-full min-h-[400px]">
                <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center overflow-hidden relative group">
                    {isLoading ? (
                        <div className="text-center p-6">
                            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                            <p className="text-slate-900 font-medium text-lg">Creating Magic</p>
                            <p className="text-slate-500 text-sm mt-2">{loadingMessage}</p>
                        </div>
                    ) : generatedVideoUrl ? (
                        <video 
                            src={generatedVideoUrl} 
                            controls 
                            autoPlay 
                            loop 
                            className="w-full h-full object-contain bg-black"
                        />
                    ) : (
                        <div className="text-center p-6 text-slate-400">
                            <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">Video preview will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default VeoStudio;