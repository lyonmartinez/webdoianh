import React, { useState, useEffect, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import { DropZone } from './components/DropZone';
import { ControlPanel } from './components/ControlPanel';
import { Button } from './components/Button';
import { ImageCard } from './components/ImageCard';
import { readFileAsDataURL, loadImage, resizeImage, convertImageToBlob } from './services/imageService';
import { analyzeImage } from './services/geminiService';
import { ResizeSettings, ImageDimensions, AppState, AIAnalysisResult, ProcessedImage } from './types';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [images, setImages] = useState<ProcessedImage[]>([]);
  
  // Settings are global for the batch
  const [settings, setSettings] = useState<ResizeSettings>({
    width: 0,
    height: 0,
    maintainAspectRatio: true,
    scalePercentage: 100,
    mode: 'percentage', // Default to percentage for batch ease
    priorityDimension: 'width',
    format: 'png'
  });

  const processingTimeoutRef = useRef<number | null>(null);

  const handleFilesSelect = async (files: File[]) => {
    const newImages: ProcessedImage[] = [];
    
    for (const file of files) {
      try {
        const dataUrl = await readFileAsDataURL(file);
        const img = await loadImage(dataUrl);
        newImages.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          originalUrl: dataUrl,
          originalDimensions: { width: img.width, height: img.height },
          previewUrl: null, // Will be generated
          processedDimensions: null,
          status: 'pending'
        });
      } catch (error) {
        console.error("Error loading file:", file.name, error);
      }
    }

    if (newImages.length === 0) return;

    // If it's the first batch, set initial settings based on the first image
    if (images.length === 0) {
      const first = newImages[0];
      setSettings(prev => ({
        ...prev,
        width: first.originalDimensions.width,
        height: first.originalDimensions.height,
        scalePercentage: 100,
        mode: 'percentage',
        format: 'png'
      }));
    }

    setImages(prev => [...prev, ...newImages]);
    setAppState(AppState.EDITING);
  };

  // Let's implement the resizing logic inside a helper that updates state, and call it from handlers + settings effect.
  const processImages = useCallback(async (currentImages: ProcessedImage[], currentSettings: ResizeSettings) => {
     const processed = await Promise.all(currentImages.map(async (img) => {
        let targetWidth = 0;
        let targetHeight = 0;

        if (currentSettings.mode === 'percentage') {
          targetWidth = Math.round(img.originalDimensions.width * (currentSettings.scalePercentage / 100));
          targetHeight = Math.round(img.originalDimensions.height * (currentSettings.scalePercentage / 100));
        } else {
          if (!currentSettings.maintainAspectRatio) {
            targetWidth = currentSettings.width;
            targetHeight = currentSettings.height;
          } else {
            const ratio = img.originalDimensions.width / img.originalDimensions.height;
            if (currentSettings.priorityDimension === 'width') {
              targetWidth = currentSettings.width;
              targetHeight = Math.round(targetWidth / ratio);
            } else {
              targetHeight = currentSettings.height;
              targetWidth = Math.round(targetHeight * ratio);
            }
          }
        }

        // Always generate a PNG preview regardless of output format
        const resizedUrl = await resizeImage(img.originalUrl, targetWidth, targetHeight);
        return {
            ...img,
            previewUrl: resizedUrl,
            processedDimensions: { width: targetWidth, height: targetHeight },
            status: 'done' as const
        };
     }));
     return processed;
  }, []);

  // Effect for settings change
  useEffect(() => {
    if (images.length === 0) return;
    
    if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);

    processingTimeoutRef.current = window.setTimeout(async () => {
        setImages(prev => {
            // We can't await inside setState, so we need to do it outside or use a pattern.
            // But we need the *latest* images state.
            return prev; 
        });
        
        // Proper way:
        const processed = await processImages(images, settings);
        setImages(processed);
    }, 300);

    return () => { if(processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.width, settings.height, settings.scalePercentage, settings.maintainAspectRatio, settings.mode, settings.priorityDimension]); 
  // NOTE: removed settings.format from dependency to avoid re-generating preview when only format changes
  
  // Effect for new images (added to list)
  useEffect(() => {
     const hasPending = images.some(img => !img.previewUrl);
     if (hasPending) {
         processImages(images, settings).then(processed => setImages(processed));
     }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]); // Trigger when count changes

  const handleRemove = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    if (images.length <= 1) { // removing the last one
       // setAppState(AppState.IDLE); // Optional: go back to home if empty?
    }
  };

  const getExtension = (format: string) => {
      switch(format) {
          case 'jpeg': return 'jpg';
          case 'dds': return 'dds';
          default: return 'png';
      }
  };

  const handleDownload = async (id: string) => {
    const img = images.find(i => i.id === id);
    if (!img || !img.previewUrl) return;
    
    // Get original name without extension
    const nameWithoutExt = img.file.name.substring(0, img.file.name.lastIndexOf('.')) || img.file.name;
    const extension = getExtension(settings.format);
    
    let filename = '';
    if (img.aiResult?.suggestedFilename) {
        // If AI result exists, replace extension
        filename = img.aiResult.suggestedFilename.replace(/\.[^/.]+$/, "") + "." + extension;
    } else {
        filename = `${nameWithoutExt}.${extension}`;
    }

    try {
        const blob = await convertImageToBlob(img.previewUrl, settings.format);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Download failed", e);
        alert("Failed to generate output file");
    }
  };

  const handleDownloadAll = async () => {
      const zip = new JSZip();
      const extension = getExtension(settings.format);
      
      const promises = images.map(async (img) => {
          if (img.previewUrl) {
            // Get original name without extension
            const nameWithoutExt = img.file.name.substring(0, img.file.name.lastIndexOf('.')) || img.file.name;
            
            let filename = '';
            if (img.aiResult?.suggestedFilename) {
                filename = img.aiResult.suggestedFilename.replace(/\.[^/.]+$/, "") + "." + extension;
            } else {
                filename = `${nameWithoutExt}.${extension}`;
            }
            
            try {
                const blob = await convertImageToBlob(img.previewUrl, settings.format);
                zip.file(filename, blob);
            } catch (e) {
                console.error(`Failed to process ${filename}`, e);
            }
          }
      });

      await Promise.all(promises);

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `images-batch-${settings.format}.zip`;
      link.click();
  };

  const handleAnalyze = async (id: string) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, isAnalyzing: true } : img));
    
    try {
        const img = images.find(i => i.id === id);
        if (!img || !img.previewUrl) return;
        
        const result = await analyzeImage(img.previewUrl);
        setImages(prev => prev.map(item => item.id === id ? { ...item, aiResult: result, isAnalyzing: false } : item));
    } catch (e) {
        console.error(e);
        setImages(prev => prev.map(img => img.id === id ? { ...img, isAnalyzing: false } : img));
    }
  };
  
  const handleAnalyzeAll = async () => {
      // Analyze all that don't have results yet
      const toAnalyze = images.filter(img => !img.aiResult);
      if (toAnalyze.length === 0) return;

      // Set loading state
      setImages(prev => prev.map(img => !img.aiResult ? { ...img, isAnalyzing: true } : img));

      // Process in parallel (browser limit usually handles 6 requests)
      // For API safety, maybe one by one or chunked? Let's do all, Gemini handles it.
      await Promise.all(toAnalyze.map(async (img) => {
          if(!img.previewUrl) return;
          try {
              const result = await analyzeImage(img.previewUrl);
              setImages(prev => prev.map(item => item.id === img.id ? { ...item, aiResult: result, isAnalyzing: false } : item));
          } catch (e) {
              console.error(e);
              setImages(prev => prev.map(item => item.id === img.id ? { ...item, isAnalyzing: false } : item));
          }
      }));
  };

  const reset = () => {
    setAppState(AppState.IDLE);
    setImages([]);
    setSettings(prev => ({ ...prev, mode: 'percentage', scalePercentage: 100, format: 'png' }));
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">
        <header className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white">PNG Pro <span className="text-blue-500 font-light">Resizer</span></span>
                </div>
                {appState !== AppState.IDLE && (
                    <div className="flex gap-2">
                         <Button variant="ghost" onClick={reset} className="text-sm">
                            Xoá tất cả
                        </Button>
                    </div>
                )}
            </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
            {appState === AppState.IDLE ? (
                <div className="min-h-[60vh] flex flex-col items-center justify-center animate-fade-in">
                    <div className="text-center mb-10 max-w-2xl">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            Thay đổi kích thước ảnh và định dạng ảnh. <br />
                            <span className="text-blue-500">Phát triển bới Luis.</span>
                        </h1>
                        <p className="text-lg text-slate-400">
                            Thay đổi hàng loạt ảnh và kích ảnh. 
                            Tự động tạo tệp SEO và văn bản thay thế.
                        </p>
                    </div>
                    <DropZone onFileSelect={handleFilesSelect} />
                </div>
            ) : (
                <div className="grid lg:grid-cols-12 gap-8 items-start">
                    {/* Controls Sidebar */}
                    <div className="lg:col-span-3 lg:sticky lg:top-24 space-y-6">
                         <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
                            <ControlPanel 
                                referenceDimensions={images[0]?.originalDimensions || { width: 0, height: 0 }}
                                settings={settings}
                                onSettingsChange={setSettings}
                                onReset={() => {
                                    const first = images[0];
                                    if(first) {
                                        setSettings(prev => ({
                                            ...prev,
                                            width: first.originalDimensions.width,
                                            height: first.originalDimensions.height,
                                            scalePercentage: 100,
                                            mode: 'percentage',
                                            format: 'png'
                                        }));
                                    }
                                }}
                                imageCount={images.length}
                            />
                        </div>
                        
                        <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
                            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Hành động hàng loạt</h3>
                            <div className="space-y-3">
                                <Button 
                                    variant="primary" 
                                    className="w-full text-sm" 
                                    onClick={handleDownloadAll}
                                >
                                    Tải xuống tất cả (ZIP)
                                </Button>
                                <Button 
                                    variant="secondary" 
                                    className="w-full text-sm"
                                    onClick={handleAnalyzeAll}
                                    isLoading={images.some(i => i.isAnalyzing)}
                                >
                                    Auto-Tag All (AI)
                                </Button>
                            </div>
                        </div>

                         <div className="bg-slate-800/20 rounded-xl p-4 border border-slate-700/30 text-xs text-slate-400">
                            <p>Mẹo: Trong chế độ "Kích thước", ưu tiên được dành cho Chiều rộng. Chiều cao được tính toán tự động trên mỗi hình ảnh để duy trì tỷ lệ khung hình.</p>
                         </div>
                    </div>

                    {/* Image Grid */}
                    <div className="lg:col-span-9 space-y-6">
                        <div className="flex justify-between items-center bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                            <h2 className="text-lg font-semibold text-white">Hình ảnh đã xử lý</h2>
                            <div className="relative">
                                {/* Hidden input for adding more */}
                                <input 
                                    type="file" 
                                    multiple 
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                        if (e.target.files) handleFilesSelect(Array.from(e.target.files));
                                        e.target.value = ''; // reset
                                    }}
                                />
                                <Button variant="ghost" className="text-sm">
                                    + Thêm ảnh
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {images.map(img => (
                                <ImageCard 
                                    key={img.id}
                                    image={img}
                                    onRemove={handleRemove}
                                    onAnalyze={handleAnalyze}
                                    onDownload={handleDownload}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </main>
    </div>
  );
}

export default App;