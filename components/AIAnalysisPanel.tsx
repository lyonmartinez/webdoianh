import React from 'react';
import { AIAnalysisResult } from '../types';
import { Button } from './Button';

interface AIAnalysisPanelProps {
  result: AIAnalysisResult | null;
  isLoading: boolean;
  onAnalyze: () => void;
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ result, isLoading, onAnalyze }) => {
  return (
    <div className="mt-8 border-t border-slate-700/50 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/20 rounded text-purple-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">AI Smart Details</h3>
        </div>
        {!result && (
            <Button 
                variant="secondary" 
                onClick={onAnalyze} 
                isLoading={isLoading}
                className="text-xs px-3 py-1.5"
            >
                Generate
            </Button>
        )}
      </div>

      {!result && !isLoading && (
        <div className="text-sm text-slate-400 bg-slate-800/30 rounded-lg p-4 border border-slate-700/30 border-dashed">
            Use Gemini AI to automatically generate a SEO-friendly filename and accessibility alt text for your resized image.
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center p-8 text-purple-400">
            <span className="animate-pulse">Analyzing image with Gemini...</span>
        </div>
      )}

      {result && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase">Suggested Filename</label>
            <div className="group flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg p-2.5">
              <code className="flex-1 text-sm text-green-400 font-mono truncate">{result.suggestedFilename}</code>
              <button 
                onClick={() => navigator.clipboard.writeText(result.suggestedFilename)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="Copy"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase">Alt Text</label>
            <div className="group bg-slate-900 border border-slate-700 rounded-lg p-3 relative">
              <p className="text-sm text-slate-300 pr-8">{result.altText}</p>
              <button 
                onClick={() => navigator.clipboard.writeText(result.altText)}
                className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="Copy"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={onAnalyze} className="text-xs text-purple-400 hover:text-purple-300 underline">
                Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};