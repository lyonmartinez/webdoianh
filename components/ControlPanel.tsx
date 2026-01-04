import React from 'react';
import { ResizeSettings, ImageDimensions, OutputFormat } from '../types';

interface ControlPanelProps {
  referenceDimensions: ImageDimensions; // Dimensions of the first image to calculate ratios
  settings: ResizeSettings;
  onSettingsChange: (newSettings: ResizeSettings) => void;
  onReset: () => void;
  imageCount: number;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  referenceDimensions,
  settings,
  onSettingsChange,
  onReset,
  imageCount
}) => {
  
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = Math.max(1, parseInt(e.target.value) || 0);
    let newHeight = settings.height;
    let newScale = settings.scalePercentage;

    if (settings.maintainAspectRatio) {
      const ratio = referenceDimensions.height / referenceDimensions.width;
      newHeight = Math.round(newWidth * ratio);
      newScale = Math.round((newWidth / referenceDimensions.width) * 100);
    }

    onSettingsChange({ 
      ...settings, 
      width: newWidth, 
      height: newHeight, 
      scalePercentage: newScale,
      mode: 'dimensions',
      priorityDimension: 'width'
    });
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = Math.max(1, parseInt(e.target.value) || 0);
    let newWidth = settings.width;
    let newScale = settings.scalePercentage;

    if (settings.maintainAspectRatio) {
      const ratio = referenceDimensions.width / referenceDimensions.height;
      newWidth = Math.round(newHeight * ratio);
      newScale = Math.round((newHeight / referenceDimensions.height) * 100);
    }

    onSettingsChange({ 
      ...settings, 
      width: newWidth, 
      height: newHeight, 
      scalePercentage: newScale,
      mode: 'dimensions',
      priorityDimension: 'height'
    });
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseInt(e.target.value);
    const newWidth = Math.round(referenceDimensions.width * (newScale / 100));
    const newHeight = Math.round(referenceDimensions.height * (newScale / 100));
    
    onSettingsChange({
      ...settings,
      scalePercentage: newScale,
      width: newWidth,
      height: newHeight,
      mode: 'percentage'
    });
  };

  const toggleAspectRatio = () => {
    onSettingsChange({ ...settings, maintainAspectRatio: !settings.maintainAspectRatio });
  };

  const setMode = (mode: 'dimensions' | 'percentage') => {
    onSettingsChange({ ...settings, mode });
  };

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingsChange({ ...settings, format: e.target.value as OutputFormat });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
        <div>
            <h3 className="text-lg font-semibold text-white">Resize Chinhr sửa</h3>
            {imageCount > 1 && <span className="text-xs text-blue-400">{imageCount} images selected</span>}
        </div>
        <button 
          onClick={onReset}
          className="text-xs text-blue-400 hover:text-blue-300 font-medium"
        >
          Trở lại
        </button>
      </div>

      <div className="space-y-2">
         <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Loại ảnh xuất ra</label>
         <div className="relative">
            <select
                value={settings.format}
                onChange={handleFormatChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
            >
                <option value="png">PNG (Standard)</option>
                <option value="jpeg">JPEG (Compressed)</option>
                <option value="dds">DDS (Game Texture)</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
         </div>
         {settings.format === 'dds' && (
             <p className="text-[10px] text-yellow-500/80 mt-1">
                 Đầu ra DDS sử dụng định dạng BGRA32 không nén. Tương thích với hầu hết các công cụ trò chơi.
             </p>
         )}
      </div>

      <div className="h-px bg-slate-700/50 my-4" />

      {/* Mode Selector */}
      <div className="flex bg-slate-800 p-1 rounded-lg">
        <button
            onClick={() => setMode('percentage')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${settings.mode === 'percentage' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
        >
            Phần trăm
        </button>
        <button
            onClick={() => setMode('dimensions')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${settings.mode === 'dimensions' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
        >
            Kích thước
        </button>
      </div>

      {/* Dimensions Inputs */}
      {settings.mode === 'dimensions' && (
        <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Width (px)</label>
                <input
                    type="number"
                    value={settings.width}
                    onChange={handleWidthChange}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                </div>
                <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Height (px)</label>
                <input
                    type="number"
                    value={settings.height}
                    onChange={handleHeightChange}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                </div>
            </div>

            <div className="flex items-center space-x-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                <button
                onClick={toggleAspectRatio}
                className={`
                    w-10 h-6 rounded-full transition-colors relative
                    ${settings.maintainAspectRatio ? 'bg-blue-600' : 'bg-slate-600'}
                `}
                >
                <div className={`
                    absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
                    ${settings.maintainAspectRatio ? 'translate-x-4' : 'translate-x-0'}
                `} />
                </button>
                <div className="flex flex-col">
                    <span className="text-sm text-slate-300">Duy trì tỷ lệ khung hình</span>
                    {imageCount > 1 && settings.maintainAspectRatio && (
                        <span className="text-xs text-slate-500">Resizes based on {settings.priorityDimension}</span>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Scale Slider */}
      {settings.mode === 'percentage' && (
        <div className="space-y-4 pt-2 animate-fade-in">
            <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-300">Tỷ lện phần trăm</label>
            <span className="text-sm font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">{settings.scalePercentage}%</span>
            </div>
            <input
            type="range"
            min="1"
            max="200"
            value={settings.scalePercentage}
            onChange={handleScaleChange}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
        </div>
      )}

      {/* Info Stats */}
      <div className="bg-slate-900/50 rounded-lg p-4 space-y-2 text-sm border border-slate-800">
        <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">Tài liệu tham khảo (Hình ảnh đầu tiên)</p>
        <div className="flex justify-between">
          <span className="text-slate-500">Nguyên </span>
          <span className="text-slate-300">{referenceDimensions.width} x {referenceDimensions.height}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Mục tiêu</span>
          <span className="text-blue-300">
            {settings.mode === 'percentage' 
                ? `${settings.scalePercentage}%`
                : `${settings.width} x ${settings.height}`
            }
          </span>
        </div>
      </div>
    </div>
  );
};