import React, { useRef, useState } from 'react';
import {
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  Video as VideoIcon,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Film,
  Info
} from 'lucide-react';
import type { ProjectVideoItem } from '../../types';
import {
  VideoCategoryVariant,
  MAX_VIDEO_UPLOAD_BYTES,
  validateVideoFile,
  formatFileSize,
  computeAspectRatioLabel,
  getVideoOrientation,
  getCloudinaryVideoPosterUrl,
  getCloudinaryMp4PlaybackUrl,
  extractLocalVideoMetadata,
  getVideoFormat
} from '../../utils/videoMedia';

interface PortfolioVideoManagerProps {
  variant: VideoCategoryVariant;
  token: string;
  projectTitle: string;
  videos: ProjectVideoItem[];
  onChange: (updatedVideos: ProjectVideoItem[]) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

interface ActiveUploadTask {
  id: string;
  filename: string;
  size: number;
  progress: number;
  stage: 'validating' | 'uploading' | 'saving' | 'done' | 'error';
  error?: string;
}

interface CloudinaryVideoResponse {
  secure_url?: string;
  public_id?: string;
  bytes?: number;
  format?: string;
  width?: number;
  height?: number;
  duration?: number;
  error?: { message?: string };
}

function getOrientationBadge(width?: number, height?: number, aspectRatio?: string): string {
  const orientation = getVideoOrientation(width, height, aspectRatio);
  if (orientation === 'portrait') return 'Portrait / Reel';
  if (orientation === 'square') return 'Square';
  return 'Landscape';
}

function deriveFilenameFromUrl(url: string): string {
  try {
    const clean = url.split('?')[0];
    const parts = clean.split('/');
    return decodeURIComponent(parts[parts.length - 1] || 'video.mp4');
  } catch {
    return 'video.mp4';
  }
}

export const PortfolioVideoManager: React.FC<PortfolioVideoManagerProps> = ({
  variant,
  token,
  projectTitle,
  videos,
  onChange,
  showToast
}) => {
  const [uploadTasks, setUploadTasks] = useState<ActiveUploadTask[]>([]);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const isUploading = uploadTasks.some((t) => t.stage === 'validating' || t.stage === 'uploading' || t.stage === 'saving');

  const sectionConfig =
    variant === 'motion-graphics'
      ? {
          title: 'Motion Graphics & Animation — Video Showcase Manager',
          subtitle:
            'Upload multiple motion graphic reels, animated ads, logo animations, and 3D product videos. Preview, replace, remove, or reorder directly.',
          buttonLabel: 'Upload Motion Videos',
          emptyMessage:
            'No motion graphics videos uploaded yet. Click "Upload Motion Videos" to add MP4, MOV, or WEBM reels.'
        }
      : variant === 'digital-social'
      ? {
          title: 'Digital Marketing & Social Media Management — Reels & Social Video Manager',
          subtitle:
            'Upload multiple Instagram Reels, short-form social videos, and campaign clips alongside your social creative images above. Preview, replace, remove, or reorder directly.',
          buttonLabel: 'Upload Reels & Social Videos',
          emptyMessage:
            'No reels or social media videos uploaded yet. Click "Upload Reels & Social Videos" to add MP4, MOV, or WEBM content.'
        }
      : {
          title: 'Video Production & Editing — Project Video Manager',
          subtitle:
            'Upload multiple promotional videos, product videos, and edited reels. Preview, replace, remove, or reorder directly.',
          buttonLabel: 'Upload Videos',
          emptyMessage:
            'No project videos uploaded yet. Click "Upload Videos" to add MP4, MOV, or WEBM videos for this case study.'
        };

  const updateTask = (taskId: string, patch: Partial<ActiveUploadTask>) => {
    setUploadTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
  };

  /**
   * Uploads a single validated video file directly to Cloudinary CDN via signed multipart FormData
   * with live XHR progress reporting. Falls back to server-side Cloudinary streaming if direct XHR fails,
   * and NEVER writes to temporary local server storage.
   */
  const uploadSingleVideoToCloud = async (
    file: File,
    taskId: string,
    orderNumber: number
  ): Promise<ProjectVideoItem> => {
    // 1. Extract local metadata (best-effort; Cloudinary response is authoritative)
    updateTask(taskId, { stage: 'validating', progress: 3 });
    const localMeta = await extractLocalVideoMetadata(file);

    // 2. Request short-lived Cloudinary upload signature from authenticated backend
    const sigRes = await fetch('/api/admin/upload/video-signature', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type
      })
    });

    const sigData = await sigRes.json().catch(() => ({}));
    if (!sigRes.ok || !sigData.success || !sigData.signature || !sigData.cloudName) {
      throw new Error(sigData.error || 'Could not authorize cloud video upload. Please verify Cloudinary settings.');
    }

    // 3. Upload directly to Cloudinary Video API via XHR for real-time progress (0-100%)
    updateTask(taskId, { stage: 'uploading', progress: 5 });

    const uploadViaDirectCloudinary = () =>
      new Promise<CloudinaryVideoResponse>((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', sigData.apiKey);
        formData.append('timestamp', String(sigData.timestamp));
        formData.append('signature', sigData.signature);
        formData.append('folder', sigData.folder);
        formData.append('use_filename', 'true');
        formData.append('unique_filename', 'true');

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${sigData.cloudName}/video/upload`, true);

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable && evt.total > 0) {
            const pct = Math.min(95, Math.max(5, Math.round((evt.loaded / evt.total) * 95)));
            updateTask(taskId, { progress: pct });
          }
        };

        xhr.onload = () => {
          let parsed: CloudinaryVideoResponse = {};
          try {
            parsed = JSON.parse(xhr.responseText || '{}');
          } catch {
            // handled below
          }
          if (xhr.status >= 200 && xhr.status < 300 && parsed.secure_url) {
            resolve(parsed);
          } else {
            reject(
              new Error(
                parsed?.error?.message ||
                  `Cloud video upload failed with HTTP ${xhr.status}.`
              )
            );
          }
        };

        xhr.onerror = () => {
          reject(new Error('NETWORK_DIRECT_FAILED'));
        };

        xhr.send(formData);
      });

    const uploadViaServerStream = () =>
      new Promise<CloudinaryVideoResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/admin/upload/video', true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.setRequestHeader('X-Video-Filename', encodeURIComponent(file.name));

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable && evt.total > 0) {
            const pct = Math.min(95, Math.max(5, Math.round((evt.loaded / evt.total) * 95)));
            updateTask(taskId, { progress: pct });
          }
        };

        xhr.onload = () => {
          let parsed: any = {};
          try {
            parsed = JSON.parse(xhr.responseText || '{}');
          } catch {
            // handled below
          }
          if (xhr.status >= 200 && xhr.status < 300 && parsed.success && parsed.url) {
            resolve({
              secure_url: parsed.url,
              public_id: parsed.publicId,
              bytes: parsed.size,
              format: parsed.format,
              width: parsed.width,
              height: parsed.height,
              duration: parsed.duration
            });
          } else {
            reject(new Error(parsed?.error || `Server video upload failed (HTTP ${xhr.status}).`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error occurred while uploading video.'));
        };

        xhr.send(file);
      });

    let cloudResult: CloudinaryVideoResponse;
    let registeredByServer = false;

    try {
      cloudResult = await uploadViaDirectCloudinary();
    } catch (directErr: any) {
      if (directErr?.message === 'NETWORK_DIRECT_FAILED') {
        cloudResult = await uploadViaServerStream();
        registeredByServer = true;
      } else {
        throw directErr;
      }
    }

    const secureUrl = cloudResult.secure_url;
    if (!secureUrl || !/^https:\/\//i.test(secureUrl)) {
      throw new Error('Cloud storage did not return a permanent HTTPS video URL.');
    }

    const width = cloudResult.width || localMeta.width;
    const height = cloudResult.height || localMeta.height;
    const resolution = width && height ? `${width} × ${height} px` : undefined;
    const aspectRatio = computeAspectRatioLabel(width, height);
    const detectedFormat = (cloudResult.format || getVideoFormat(file.name, file.type)).toUpperCase();
    const bytes = cloudResult.bytes || file.size;
    const duration =
      typeof cloudResult.duration === 'number'
        ? Math.round(cloudResult.duration * 10) / 10
        : localMeta.duration;
    const poster = getCloudinaryVideoPosterUrl(secureUrl);

    // 4. Register uploaded video in backend mediaLibrary & Neon PostgreSQL
    updateTask(taskId, { stage: 'saving', progress: 97 });
    if (!registeredByServer) {
      const regRes = await fetch('/api/admin/upload/video-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          url: secureUrl,
          filename: file.name,
          size: bytes,
          format: detectedFormat,
          mimeType: file.type
        })
      });
      if (!regRes.ok) {
        const regErr = await regRes.json().catch(() => ({}));
        console.warn('[Video Register Warning]:', regErr?.error || regRes.statusText);
      }
    }

    updateTask(taskId, { stage: 'done', progress: 100 });

    const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();

    return {
      id: `vid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      url: secureUrl,
      publicId: cloudResult.public_id,
      filename: file.name,
      format: detectedFormat,
      size: bytes,
      width,
      height,
      resolution,
      aspectRatio,
      duration,
      order: orderNumber,
      title: cleanTitle || `${projectTitle || 'Project'} Video ${orderNumber}`,
      caption: cleanTitle || `${projectTitle || 'Project'} — Video ${orderNumber}`,
      poster,
      uploadedAt: new Date().toISOString()
    };
  };

  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorBanner(null);

    const files = Array.from(fileList);
    const validFiles: File[] = [];
    const validationErrors: string[] = [];

    for (const file of files) {
      const check = validateVideoFile(file, MAX_VIDEO_UPLOAD_BYTES);
      if (!check.valid) {
        validationErrors.push(check.error || `Invalid file: ${file.name}`);
      } else {
        if (check.warning) {
          showToast(check.warning, 'success');
        }
        validFiles.push(file);
      }
    }

    if (validationErrors.length > 0) {
      const combined = validationErrors.join(' ');
      setErrorBanner(combined);
      showToast(validationErrors[0], 'error');
    }

    if (validFiles.length === 0) return;

    const initialTasks: ActiveUploadTask[] = validFiles.map((file, idx) => ({
      id: `task-${Date.now()}-${idx}`,
      filename: file.name,
      size: file.size,
      progress: 0,
      stage: 'validating'
    }));
    setUploadTasks(initialTasks);

    let workingVideos = [...videos];
    let uploadedCount = 0;
    const uploadErrors: string[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const task = initialTasks[i];
      try {
        const newVideo = await uploadSingleVideoToCloud(file, task.id, workingVideos.length + 1);
        workingVideos = [...workingVideos, newVideo].map((v, idx) => ({ ...v, order: idx + 1 }));
        onChange(workingVideos);
        uploadedCount++;
      } catch (err: any) {
        const msg = err?.message || `Failed to upload "${file.name}".`;
        updateTask(task.id, { stage: 'error', error: msg });
        uploadErrors.push(`${file.name}: ${msg}`);
      }
    }

    if (uploadErrors.length > 0) {
      setErrorBanner(uploadErrors.join(' | '));
      showToast(uploadErrors[0], 'error');
    }
    if (uploadedCount > 0) {
      showToast(
        `${uploadedCount} video${uploadedCount > 1 ? 's' : ''} uploaded to cloud storage! Click "Save Case Study" to persist.`,
        'success'
      );
    }

    // Clear completed tasks after a brief pause while keeping any error items visible
    window.setTimeout(() => {
      setUploadTasks((prev) => prev.filter((t) => t.stage === 'error'));
    }, 3000);
  };

  const handleReplaceFile = async (file: File | null, index: number) => {
    if (!file || index < 0 || index >= videos.length) return;
    setErrorBanner(null);

    const check = validateVideoFile(file, MAX_VIDEO_UPLOAD_BYTES);
    if (!check.valid) {
      const msg = check.error || 'Invalid video file.';
      setErrorBanner(msg);
      showToast(msg, 'error');
      return;
    }
    if (check.warning) {
      showToast(check.warning, 'success');
    }

    const taskId = `replace-${Date.now()}`;
    setUploadTasks([
      {
        id: taskId,
        filename: `Replacing #${index + 1}: ${file.name}`,
        size: file.size,
        progress: 0,
        stage: 'validating'
      }
    ]);

    try {
      const existing = videos[index];
      const replacement = await uploadSingleVideoToCloud(file, taskId, index + 1);
      const merged: ProjectVideoItem = {
        ...replacement,
        id: existing.id || replacement.id,
        title: replacement.title || existing.title,
        caption: existing.caption && existing.caption !== existing.title ? existing.caption : replacement.caption,
        order: index + 1
      };

      const nextVideos = videos.map((v, idx) => (idx === index ? merged : { ...v, order: idx + 1 }));
      onChange(nextVideos);
      showToast(`Video #${index + 1} replaced with "${file.name}".`, 'success');
      window.setTimeout(() => {
        setUploadTasks((prev) => prev.filter((t) => t.id !== taskId));
      }, 2500);
    } catch (err: any) {
      const msg = err?.message || `Failed to replace video #${index + 1}.`;
      updateTask(taskId, { stage: 'error', error: msg });
      setErrorBanner(msg);
      showToast(msg, 'error');
    } finally {
      setReplacingIndex(null);
    }
  };

  const handleRemoveVideo = (idx: number) => {
    const next = videos.filter((_, i) => i !== idx).map((v, i) => ({ ...v, order: i + 1 }));
    onChange(next);
    showToast('Video removed from project.', 'success');
  };

  const handleMoveVideo = (idx: number, dir: 'up' | 'down') => {
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= videos.length) return;
    const next = [...videos];
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved);
    onChange(next.map((v, i) => ({ ...v, order: i + 1 })));
  };

  const handleUpdateVideoCaption = (idx: number, caption: string) => {
    const next = videos.map((v, i) => (i === idx ? { ...v, caption, title: caption } : v));
    onChange(next);
  };

  return (
    <div className="p-5 bg-[#F7F7F5] rounded-2xl border border-[#E4D8C8] space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4D8C8]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Film className="w-4 h-4 text-[#F07822]" />
            <h4 className="text-xs font-bold text-[#173B75]">{sectionConfig.title}</h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#173B75] text-white">
              {videos.length} {videos.length === 1 ? 'Video' : 'Videos'}
            </span>
          </div>
          <p className="text-[11px] text-[#252A34]/70 mt-0.5">{sectionConfig.subtitle}</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label
            className={`px-3.5 py-2 bg-[#173B75] hover:bg-[#123163] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors ${
              isUploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
            }`}
          >
            {isUploading ? (
              <RefreshCw className="w-3.5 h-3.5 text-[#F07822] animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-[#F07822]" />
            )}
            <span>{isUploading ? 'Uploading...' : sectionConfig.buttonLabel}</span>
            <input
              type="file"
              multiple
              accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
              disabled={isUploading}
              onChange={(e) => {
                handleUploadFiles(e.target.files);
                e.target.value = '';
              }}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Hidden Replace Input */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
        onChange={(e) => {
          const selected = e.target.files?.[0] || null;
          if (selected && replacingIndex !== null) {
            handleReplaceFile(selected, replacingIndex);
          }
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Recommended Dimensions & Specifications Table */}
      <div className="bg-white rounded-xl border border-[#E4D8C8] overflow-hidden">
        <div className="px-3.5 py-2 bg-[#FFF9F1] border-b border-[#E4D8C8] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#173B75]">
            <Info className="w-3.5 h-3.5 text-[#F07822]" />
            <span>Recommended Video Dimensions & Specifications</span>
          </div>
          <span className="text-[10px] font-mono font-semibold text-[#173B75] bg-[#E8EFF8] px-2 py-0.5 rounded-full">
            Cloudinary Permanent Storage
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-[#F7F7F5]/70 text-[#252A34]/70 font-mono text-[10px] uppercase border-b border-[#E4D8C8]">
              <tr>
                <th className="px-3.5 py-2 font-bold">Video Type</th>
                <th className="px-3.5 py-2 font-bold">Recommended Resolution</th>
                <th className="px-3.5 py-2 font-bold">Aspect Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4D8C8]/60 text-[#252A34]">
              <tr>
                <td className="px-3.5 py-2 font-semibold text-[#173B75]">Landscape</td>
                <td className="px-3.5 py-2 font-mono">1920 × 1080 px</td>
                <td className="px-3.5 py-2 font-bold text-[#F07822]">16:9</td>
              </tr>
              <tr>
                <td className="px-3.5 py-2 font-semibold text-[#173B75]">Portrait / Reel</td>
                <td className="px-3.5 py-2 font-mono">1080 × 1920 px</td>
                <td className="px-3.5 py-2 font-bold text-[#F07822]">9:16</td>
              </tr>
              <tr>
                <td className="px-3.5 py-2 font-semibold text-[#173B75]">Square</td>
                <td className="px-3.5 py-2 font-mono">1080 × 1080 px</td>
                <td className="px-3.5 py-2 font-bold text-[#F07822]">1:1</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-3.5 py-2.5 bg-[#FFF9F1]/60 border-t border-[#E4D8C8] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
          <div>
            <span className="block font-mono text-[10px] text-[#252A34]/60 uppercase">Supported Formats</span>
            <span className="font-bold text-[#173B75]">MP4, MOV, WEBM</span>
          </div>
          <div>
            <span className="block font-mono text-[10px] text-[#252A34]/60 uppercase">Recommended Format</span>
            <span className="font-bold text-[#173B75]">MP4 (H.264)</span>
          </div>
          <div>
            <span className="block font-mono text-[10px] text-[#252A34]/60 uppercase">Recommended Size</span>
            <span className="font-bold text-emerald-700">Under 50 MB / video</span>
          </div>
          <div>
            <span className="block font-mono text-[10px] text-[#252A34]/60 uppercase">Max Upload Limit</span>
            <span className="font-bold text-[#F07822]">100 MB / video (Cloudinary)</span>
          </div>
        </div>
      </div>

      {/* Inline Validation / Upload Error Banner */}
      {errorBanner && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block">Upload Notice</span>
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="text-[11px] font-bold text-red-700 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Live Upload Progress Queue */}
      {uploadTasks.length > 0 && (
        <div className="space-y-2">
          {uploadTasks.map((task) => (
            <div
              key={task.id}
              className={`p-3 rounded-xl border bg-white space-y-1.5 ${
                task.stage === 'error'
                  ? 'border-red-300 bg-red-50/40'
                  : task.stage === 'done'
                  ? 'border-emerald-300 bg-emerald-50/40'
                  : 'border-[#E4D8C8]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  {task.stage === 'done' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : task.stage === 'error' ? (
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 text-[#F07822] animate-spin shrink-0" />
                  )}
                  <span className="font-semibold text-[#173B75] truncate">{task.filename}</span>
                  <span className="text-[10px] font-mono text-[#252A34]/60 shrink-0">
                    ({formatFileSize(task.size)})
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-[#173B75] shrink-0">
                  {task.stage === 'error'
                    ? 'Failed'
                    : task.stage === 'done'
                    ? '100% Uploaded'
                    : task.stage === 'saving'
                    ? 'Finalizing...'
                    : `${task.progress}%`}
                </span>
              </div>

              {task.stage !== 'error' && (
                <div className="w-full h-1.5 bg-[#E8EFF8] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 ${
                      task.stage === 'done' ? 'bg-emerald-500' : 'bg-[#F07822]'
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              )}

              {task.error && <p className="text-[11px] text-red-700">{task.error}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Videos Grid */}
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {videos.map((vid, vIdx) => {
            const filename = vid.filename || deriveFilenameFromUrl(vid.url);
            const format = (vid.format || getVideoFormat(filename)).toUpperCase();
            const resolution =
              vid.resolution || (vid.width && vid.height ? `${vid.width} × ${vid.height} px` : 'Auto-detected');
            const aspectRatio = vid.aspectRatio || computeAspectRatioLabel(vid.width, vid.height);
            const orientationLabel = getOrientationBadge(vid.width, vid.height, aspectRatio);
            const posterUrl = vid.poster || getCloudinaryVideoPosterUrl(vid.url);
            const mp4Fallback = getCloudinaryMp4PlaybackUrl(vid.url);

            return (
              <div
                key={vid.id || vIdx}
                className="p-3 rounded-xl border border-[#E4D8C8] bg-white flex flex-col justify-between gap-3 shadow-2xs"
              >
                {/* Video Preview Player */}
                <div className="relative rounded-lg overflow-hidden bg-black border border-[#E4D8C8] h-48 flex items-center justify-center">
                  <video
                    key={vid.url}
                    controls
                    preload="metadata"
                    playsInline
                    poster={posterUrl}
                    className="w-full h-full object-contain"
                  >
                    {mp4Fallback && <source src={mp4Fallback} type="video/mp4" />}
                    <source src={vid.url} />
                  </video>

                  <div className="absolute top-2 left-2 flex items-center gap-1 pointer-events-none">
                    <span className="w-5 h-5 rounded-full bg-[#173B75]/95 text-white flex items-center justify-center text-[10px] font-mono font-bold shadow-xs">
                      {vIdx + 1}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-black/75 text-white text-[9px] font-mono font-bold uppercase">
                      {format}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#F07822] text-white text-[9px] font-mono font-bold">
                      {aspectRatio}
                    </span>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={vid.caption || vid.title || ''}
                    placeholder="Video title / caption shown in modal..."
                    onChange={(e) => handleUpdateVideoCaption(vIdx, e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#E4D8C8] rounded-lg text-xs bg-[#FFF9F1]/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#173B75]"
                  />

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 p-2.5 rounded-lg bg-[#F7F7F5] border border-[#E4D8C8]/70 text-[10px]">
                    <div className="col-span-2 min-w-0">
                      <span className="text-[#252A34]/60 font-mono uppercase block">Filename</span>
                      <span className="font-semibold text-[#173B75] truncate block" title={filename}>
                        {filename}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#252A34]/60 font-mono uppercase block">File Size</span>
                      <span className="font-semibold text-[#252A34]">{formatFileSize(vid.size)}</span>
                    </div>
                    <div>
                      <span className="text-[#252A34]/60 font-mono uppercase block">Resolution</span>
                      <span className="font-semibold text-[#252A34]">{resolution}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[#252A34]/60 font-mono uppercase block">Aspect Ratio</span>
                      <span className="font-semibold text-[#173B75]">
                        {aspectRatio} ({orientationLabel})
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-[#E4D8C8]">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => {
                        setReplacingIndex(vIdx);
                        replaceInputRef.current?.click();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#EEF2F9] hover:bg-[#173B75] text-[#173B75] hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <Upload className="w-3 h-3 text-[#F07822]" />
                      <span>Replace</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={vIdx === 0 || isUploading}
                        onClick={() => handleMoveVideo(vIdx, 'up')}
                        className="p-1.5 hover:bg-[#EEF2F9] rounded-lg text-[#173B75] disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={vIdx === videos.length - 1 || isUploading}
                        onClick={() => handleMoveVideo(vIdx, 'down')}
                        className="p-1.5 hover:bg-[#EEF2F9] rounded-lg text-[#173B75] disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => handleRemoveVideo(vIdx)}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg cursor-pointer disabled:opacity-30"
                        title="Remove Video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 text-center border border-dashed border-[#E4D8C8] rounded-xl bg-white space-y-1.5">
          <div className="w-9 h-9 rounded-full bg-[#173B75]/10 text-[#173B75] flex items-center justify-center mx-auto">
            <VideoIcon className="w-4 h-4 text-[#F07822]" />
          </div>
          <p className="text-xs text-[#252A34]/70">{sectionConfig.emptyMessage}</p>
        </div>
      )}
    </div>
  );
};
