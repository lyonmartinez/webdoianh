import React, { useCallback, useState } from 'react';

interface DropZoneProps {
  onFileSelect: (files: File[]) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        onFileSelect(imageFiles);
      }
    }
  }, [onFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const imageFiles = Array.from(files); // FileList is already filtered by accept attr usually, but good to be safe
      onFileSelect(imageFiles);
    }
  }, [onFileSelect]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative group cursor-pointer
        w-full max-w-2xl mx-auto h-64
        border-2 border-dashed rounded-2xl
        flex flex-col items-center justify-center
        transition-all duration-300
        ${isDragging 
          ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' 
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'}
      `}
    >
      <input
        type="file"
        accept="image/png, image/jpeg, image/webp"
        multiple
        onChange={handleInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      
      <div className="flex flex-col items-center space-y-4 text-center p-6">
        <div className={`p-4 rounded-full bg-slate-800 ring-1 ring-slate-700 transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
           <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-200">
            Thả hình vô ảnh vô hoặc <span className="text-blue-400">chọn từ thư viện</span>
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Hỗ trợ các định dạng PNG, JPG, WebP
          </p>
        </div>
      </div>
    </div>
  );
};