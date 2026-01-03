export type OutputFormat = 'png' | 'jpeg' | 'dds';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ResizeSettings {
  width: number;
  height: number;
  maintainAspectRatio: boolean;
  scalePercentage: number;
  mode: 'dimensions' | 'percentage';
  priorityDimension: 'width' | 'height'; // Which dimension controls the aspect ratio calculation
  format: OutputFormat;
}

export interface AIAnalysisResult {
  suggestedFilename: string;
  altText: string;
}

export interface ProcessedImage {
  id: string;
  file: File;
  originalUrl: string;
  originalDimensions: ImageDimensions;
  previewUrl: string | null;
  processedDimensions: ImageDimensions | null;
  status: 'pending' | 'processing' | 'done' | 'error';
  aiResult?: AIAnalysisResult;
  isAnalyzing?: boolean;
}

export enum AppState {
  IDLE = 'IDLE',
  EDITING = 'EDITING',
}