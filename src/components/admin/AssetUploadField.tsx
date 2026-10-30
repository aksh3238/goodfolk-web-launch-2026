import React, { useRef, useState } from 'react';
import { Upload, Trash2, CheckCircle2, Image as ImageIcon, Video as VideoIcon, Info, Sliders, Eye, X } from 'lucide-react';

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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);

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
        <div className="md:col-span-7 space-y-2.5">
          {currentUrl ? (
            <div className="space-y-2">
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

                {/* Quick overlay actions on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-white text-[#173B75] text-xs font-bold hover:bg-[#FFF9F1] transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#F07822]" />
                    <span>Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-3 py-1.5 rounded-lg bg-white text-[#173B75] text-xs font-bold hover:bg-[#FFF9F1] transition-all flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#F07822]" />
                    <span>{uploading ? 'Uploading...' : 'Replace'}</span>
                  </button>
                </div>
              </div>

              {/* Dedicated persistent action bar below preview */}
              {isConfirmingRemove ? (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between gap-2 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-800">
                    <Trash2 className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>Remove image from this location?</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onClear?.();
                        setIsConfirmingRemove(false);
                      }}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Confirm Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingRemove(false)}
                      className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 text-[11px] font-bold rounded-lg border border-gray-300 cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#EEF2F9] text-[#173B75] hover:bg-[#173B75] hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#F07822]" />
                    <span>Preview Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-3 py-1.5 rounded-lg bg-white border border-[#E4D8C8] hover:border-[#173B75] text-[#173B75] transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#F07822]" />
                    <span>{uploading ? 'Uploading...' : 'Replace Image'}</span>
                  </button>

                  {onClear && (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingRemove(true)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-red-200 hover:bg-red-50 text-red-600 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Image</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 p-4 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-[#F07822] bg-[#FFF9F1]'
                  : 'border-[#E4D8C8] hover:border-[#173B75] bg-[#FFF9F1]/40 hover:bg-[#FFF9F1]'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-[#173B75]/10 text-[#173B75] flex items-center justify-center">
                <Upload className="w-4 h-4 text-[#F07822]" />
              </div>
              <div className="space-y-0.5">
                <span className="inline-block px-3 py-1 rounded-lg bg-[#173B75] text-white text-xs font-bold shadow-xs">
                  {uploading ? 'Processing & Saving...' : 'Upload Image'}
                </span>
                <p className="text-[11px] text-[#252A34]/60 pt-1">
                  Click to select file or drag and drop here
                </p>
              </div>
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

      {/* Image Preview Inspection Modal */}
      {isPreviewOpen && currentUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-[#E4D8C8]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4D8C8] bg-[#FFF9F1]">
              <div>
                <h4 className="text-sm font-bold text-[#173B75]">{label}</h4>
                <p className="text-[11px] text-[#252A34]/70">
                  Target: <span className="font-semibold">{sectionName}</span> · Specs: {recommendedDimensions} ({aspectRatio})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-[#EEF2F9] text-[#173B75] flex items-center justify-center border border-[#E4D8C8] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-auto flex items-center justify-center bg-slate-950/10 min-h-[300px]">
              {mediaType === 'video' ? (
                <video src={currentUrl} controls className="max-h-[70vh] w-auto max-w-full rounded-xl shadow-lg" />
              ) : (
                <img
                  src={currentUrl}
                  alt={label}
                  className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
                />
              )}
            </div>
            <div className="px-6 py-3 border-t border-[#E4D8C8] bg-white flex items-center justify-between text-xs text-[#252A34]/70">
              <span className="font-mono truncate max-w-md">{currentUrl}</span>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-1.5 bg-[#173B75] text-white rounded-xl text-xs font-bold hover:bg-[#123163] cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
