import React from 'react';
import { ProcessedImage, ResizeSettings } from '../types';
import { Button } from './Button';

interface ImageCardProps {
  image: ProcessedImage;
  onRemove: (id: string) => void;
  onAnalyze: (id: string) => void;
  onDownload: (id: string) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ image, onRemove, onAnalyze, onDownload }) => {
  const sizeDiff = image.processedDimensions && image.originalDimensions ? 
    Math.round((image.processedDimensions.width * image.processedDimensions.height) / (image.originalDimensions.width * image.originalDimensions.height) * 100) : 100;

  return (
    <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 overflow-hidden flex flex-col sm:flex-row h-auto sm:h-48 backdrop-blur-sm transition-all hover:border-slate-600">
      {/* Thumbnail Area */}
      <div className="w-full sm:w-48 bg-slate-900/50 relative group flex items-center justify-center p-2 border-b sm:border-b-0 sm:border-r border-slate-700/50">
        <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
                backgroundImage: `linear-gradient(45deg, #334155 25%, transparent 25%), linear-gradient(-45deg, #334155 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #334155 75%), linear-gradient(-45deg, transparent 75%, #334155 75%)`,
                backgroundSize: '10px 10px'
            }} 
        />
        {image.previewUrl ? (
             <img src={image.previewUrl} alt="preview" className="max-w-full max-h-full object-contain relative z-10" />
        ) : (
            <div className="animate-pulse w-full h-full bg-slate-800" />
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div className="flex justify-between items-start">
            <div className="space-y-1 overflow-hidden">
                <h4 className="font-medium text-slate-200 truncate pr-4" title={image.file.name}>{image.file.name}</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span>Original: <span className="text-slate-300">{image.originalDimensions.width}x{image.originalDimensions.height}</span></span>
                    <span className="text-slate-600">→</span>
                    <span>New: <span className="text-blue-300">
                        {image.processedDimensions ? `${image.processedDimensions.width}x${image.processedDimensions.height}` : '...'}
                    </span></span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">{sizeDiff}% scale</span>
                </div>
            </div>
            <button 
                onClick={() => onRemove(image.id)}
                className="text-slate-500 hover:text-red-400 p-1 rounded-full hover:bg-slate-700/50 transition-colors"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        {/* AI Section */}
        {image.aiResult ? (
            <div className="mt-3 bg-slate-900/50 rounded-lg p-2.5 border border-slate-700/30 text-xs space-y-1.5">
                 <div className="flex items-center gap-2">
                    <span className="text-purple-400 font-semibold">AI Filename:</span>
                    <code className="text-green-400 font-mono truncate cursor-pointer hover:text-green-300" onClick={() => navigator.clipboard.writeText(image.aiResult!.suggestedFilename)}>
                        {image.aiResult.suggestedFilename}
                    </code>
                 </div>
                 <div className="flex items-start gap-2">
                    <span className="text-purple-400 font-semibold whitespace-nowrap">Alt Text:</span>
                    <p className="text-slate-300 line-clamp-1 hover:line-clamp-none cursor-pointer" title={image.aiResult.altText} onClick={() => navigator.clipboard.writeText(image.aiResult!.altText)}>
                        {image.aiResult.altText}
                    </p>
                 </div>
            </div>
        ) : (
            <div className="mt-3">
                 <button 
                    onClick={() => onAnalyze(image.id)}
                    disabled={image.isAnalyzing}
                    className="text-xs flex items-center gap-1.5 text-purple-400 hover:text-purple-300 disabled:opacity-50"
                >
                    <svg className={`w-3.5 h-3.5 ${image.isAnalyzing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {image.isAnalyzing ? (
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        ) : (
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        )}
                    </svg>
                    {image.isAnalyzing ? 'Analyzing...' : 'Generate Smart Tags'}
                </button>
            </div>
        )}

        <div className="flex justify-end mt-2">
            <Button variant="primary" onClick={() => onDownload(image.id)} className="py-1.5 px-3 text-sm">
                Download
            </Button>
        </div>
      </div>
    </div>
  );
};