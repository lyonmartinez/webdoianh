import { ImageDimensions, OutputFormat } from '../types';

export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
};

export const resizeImage = async (
  imageSrc: string,
  width: number,
  height: number
): Promise<string> => {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Set high quality interpolation
  canvas.width = width;
  canvas.height = height;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(img, 0, 0, width, height);

  // Always return PNG for high-quality preview
  return canvas.toDataURL('image/png');
};

export const calculateAspectRatioFit = (
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  maxHeight: number
): ImageDimensions => {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return {
    width: Math.round(srcWidth * ratio),
    height: Math.round(srcHeight * ratio),
  };
};

// DDS Format Helpers
const createDDSHeader = (width: number, height: number): ArrayBuffer => {
  const header = new ArrayBuffer(128);
  const view = new DataView(header);

  // Magic 'DDS '
  view.setUint32(0, 0x20534444, true);
  
  // dwSize (124)
  view.setUint32(4, 124, true);
  
  // dwFlags (DDSD_CAPS | DDSD_HEIGHT | DDSD_WIDTH | DDSD_PITCH | DDSD_PIXELFORMAT)
  view.setUint32(8, 0x1 | 0x2 | 0x4 | 0x8 | 0x1000, true);
  
  // dwHeight
  view.setUint32(12, height, true);
  
  // dwWidth
  view.setUint32(16, width, true);
  
  // dwPitchOrLinearSize (Width * 4 bytes per pixel for BGRA32)
  view.setUint32(20, width * 4, true);
  
  // PixelFormat
  // dwSize (32)
  view.setUint32(76, 32, true);
  // dwFlags (DDPF_RGB | DDPF_ALPHAPIXELS)
  view.setUint32(80, 0x40 | 0x1, true);
  // dwRGBBitCount (32)
  view.setUint32(88, 32, true);
  // dwRBitMask (0x00FF0000)
  view.setUint32(92, 0x00FF0000, true);
  // dwGBitMask (0x0000FF00)
  view.setUint32(96, 0x0000FF00, true);
  // dwBBitMask (0x000000FF)
  view.setUint32(100, 0x000000FF, true);
  // dwABitMask (0xFF000000)
  view.setUint32(104, 0xFF000000, true);
  
  // dwCaps (DDSCAPS_TEXTURE)
  view.setUint32(108, 0x1000, true);

  return header;
};

const createDDSBlob = (width: number, height: number, data: Uint8ClampedArray): Blob => {
  const header = createDDSHeader(width, height);
  
  // Convert RGBA to BGRA
  const bgraData = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += 4) {
    bgraData[i] = data[i + 2];     // B
    bgraData[i + 1] = data[i + 1]; // G
    bgraData[i + 2] = data[i];     // R
    bgraData[i + 3] = data[i + 3]; // A
  }

  return new Blob([header, bgraData], { type: 'image/vnd-ms.dds' });
};

export const convertImageToBlob = async (
  dataUrl: string, 
  format: OutputFormat
): Promise<Blob> => {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context failed');
  
  ctx.drawImage(img, 0, 0);

  if (format === 'dds') {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return createDDSBlob(canvas.width, canvas.height, imageData.data);
  } else if (format === 'jpeg') {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to Blob failed'));
      }, 'image/jpeg', 0.92);
    });
  } else {
    // PNG
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to Blob failed'));
      }, 'image/png');
    });
  }
};