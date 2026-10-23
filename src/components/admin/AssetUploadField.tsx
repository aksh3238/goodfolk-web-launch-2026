import React, { useRef, useState } from 'react';
import { Upload, Trash2, CheckCircle2, Image as ImageIcon, Video as VideoIcon, Info, Sliders } from 'lucide-react';

export interface AssetUploadFieldProps {
  label: string;
  sectionName: string;
  currentUrl?: string;
  onUpload: (file: File) => Promise<void>;
  onClear?: () => void;
  recommendedDimensions: string;
  aspectRatio: string;
  supportedFormats?: string;
  maxFileSize?: string;
  isOptional?: boolean;
  mediaType?: 'image' | 'video';
  focalPoint?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  onFocalPointChange?: (fp: 'center' | 'top' | 'bottom' | 'left' | 'right') => void;
  helpText?: string;
  className?: string;
}

export const AssetUploadField: React.FC<AssetUploadFieldProps> = ({
  label,
  sectionName,
  currentUrl,
  onUpload,
  onClear,
  recommendedDimensions,
  aspectRatio,
  supportedFormats = 'PNG, JPG, WebP, SVG',
  maxFileSize = '10 MB',
  isOptional = false,
  mediaType = 'image',
  focalPoint,
  onFocalPointChange,
  helpText,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={`p-4 rounded-2xl bg-white border border-[#E4D8C8] shadow-xs space-y-3 ${className}`}>
      {/* Header with Title and Section Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-[#E4D8C8]/60">
        <div className="flex items-center gap-2">
          {mediaType === 'video' ? (
            <VideoIcon className="w-4 h-4 text-[#F07822]" />
          ) : (
            <ImageIcon className="w-4 h-4 text-[#F07822]" />
          )}
          <span className="text-xs font-bold text-[#173B75]">{label}</span>
          {isOptional && (
            <span className="text-[10px] text-[#252A34]/50 italic">(Optional)</span>
          )}
        </div>
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8EFF8] text-[#173B75] text-[10px] font-semibold self-start sm:self-auto">
          <span>Target Section:</span>
          <span className="font-bold">{sectionName}</span>
        </div>
      </div>

      {/* Main Grid: Upload & Preview on Left, Dimension Specs directly beside on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Preview & Upload Control (7 cols) */}
        <div className="md:col-span-7 space-y-2">
          {currentUrl ? (
            <div className="relative group rounded-xl overflow-hidden border border-[#E4D8C8] bg-slate-900/5">
              {mediaType === 'video' ? (
                <video
                  src={currentUrl}
                  controls
                  className="w-full h-36 object-cover bg-black"
                />
              ) : (
                <div className="relative h-36 w-full overflow-hidden bg-[#FFF9F1]">
                  <img
                    src={currentUrl}
                    alt={label}
                    className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                      focalPoint === 'top'
                        ? 'object-top'
                        : focalPoint === 'bottom'
                        ? 'object-bottom'
                        : focalPoint === 'left'
                        ? 'object-left'
                        : focalPoint === 'right'
                        ? 'object-right'
                        : 'object-center'
                    }`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=1200&q=80';
                    }}
                  />
                </div>
              )}

              {/* Action Buttons Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-3 py-1.5 rounded-lg bg-white text-[#173B75] text-xs font-bold hover:bg-[#FFF9F1] transition-all flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5 text-[#F07822]" />
                  <span>{uploading ? 'Uploading...' : 'Replace Asset'}</span>
                </button>
                {onClear && (
                  <button
                    type="button"
                    onClick={onClear}
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`h-36 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 p-4 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-[#F07822] bg-[#FFF9F1]'
                  : 'border-[#E4D8C8] hover:border-[#173B75] bg-[#FFF9F1]/40 hover:bg-[#FFF9F1]'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-[#173B75]/10 text-[#173B75] flex items-center justify-center">
                <Upload className="w-4 h-4 text-[#F07822]" />
              </div>
              <div className="text-xs font-bold text-[#173B75]">
                {uploading ? 'Processing & Saving...' : 'Click or Drop File to Upload'}
              </div>
              <p className="text-[10px] text-[#252A34]/60">
                {mediaType === 'video' ? 'Select an MP4/WebM video asset' : 'Select high-resolution image'}
              </p>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            accept={mediaType === 'video' ? 'video/mp4,video/webm,video/*' : 'image/*'}
            className="hidden"
          />

          {/* Optional Focal Point alignment control */}
          {onFocalPointChange && currentUrl && (
            <div className="pt-1 flex items-center gap-2 text-[11px] text-[#252A34]/80">
              <Sliders className="w-3 h-3 text-[#173B75]" />
              <span className="font-semibold">Focal Point:</span>
              <div className="flex items-center gap-1">
                {(['center', 'top', 'bottom', 'left', 'right'] as const).map((fp) => (
                  <button
                    key={fp}
                    type="button"
                    onClick={() => onFocalPointChange(fp)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize transition-all cursor-pointer ${
                      focalPoint === fp
                        ? 'bg-[#173B75] text-white'
                        : 'bg-white border border-[#E4D8C8] hover:bg-[#E8EFF8] text-[#173B75]'
                    }`}
                  >
                    {fp}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mandatory Dimension Specs Box Directly Beside (5 cols) */}
        <div className="md:col-span-5 bg-[#F7F7F5] rounded-xl p-3.5 border border-[#E4D8C8] space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-[#173B75] font-bold text-[11px] uppercase tracking-wider">
            <Info className="w-3.5 h-3.5 text-[#F07822]" />
            <span>Asset Specifications</span>
          </div>

          <div className="space-y-1.5 pt-0.5 text-[11px]">
            <div className="flex items-start justify-between gap-2 border-b border-[#E4D8C8]/60 pb-1">
              <span className="text-[#252A34]/70">Dimensions:</span>
              <span className="font-mono font-bold text-[#173B75] text-right">
                {recommendedDimensions}
              </span>
            </div>

            <div className="flex items-start justify-between gap-2 border-b border-[#E4D8C8]/60 pb-1">
              <span className="text-[#252A34]/70">Aspect Ratio:</span>
              <span className="font-mono font-semibold text-[#173B75] text-right">
                {aspectRatio}
              </span>
            </div>

            <div className="flex items-start justify-between gap-2 border-b border-[#E4D8C8]/60 pb-1">
              <span className="text-[#252A34]/70">Supported:</span>
              <span className="font-mono font-medium text-[#252A34]/85 text-right">
                {supportedFormats}
              </span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <span className="text-[#252A34]/70">Max Size:</span>
              <span className="font-mono font-semibold text-[#252A34] text-right">
                {maxFileSize}
              </span>
            </div>
          </div>

          {helpText && (
            <p className="text-[10px] text-[#252A34]/70 pt-1 border-t border-[#E4D8C8]/60 leading-tight">
              {helpText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
