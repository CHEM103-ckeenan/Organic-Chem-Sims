// Global window extension for AI Studio key selection
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}

// Reaction Simulation Types
export interface Atom {
  id: string;
  element: 'C' | 'H' | 'Br' | 'Nu';
  x: number;
  y: number;
  z: number; // For depth sorting/scaling
  color: string;
  radius: number;
}

export interface Bond {
  atom1Id: string;
  atom2Id: string;
  length: number;
  opacity: number;
}

// Veo Types
export enum AspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
}

export type VideoGenerationStatus = 'idle' | 'uploading' | 'generating' | 'completed' | 'error';

export interface GeneratedVideo {
  uri: string;
  mimeType: string;
}