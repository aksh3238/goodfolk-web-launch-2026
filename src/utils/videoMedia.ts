export type VideoCategoryVariant = 'video-social' | 'motion-graphic';

export const RECOMMENDED_VIDEO_MAX_BYTES = 50 * 1024 * 1024; // 50 MB recommended
export const MAX_VIDEO_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB Cloudinary video limit

export const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm'] as const;
export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm'
] as const;

/**
 * Determines whether a portfolio category should display a dedicated video upload section.
 * Matches "Video & Social" and "Motion Graphics" / "Motion Graphic" (case-insensitive).
 */
export function getVideoCategoryVariant(category?: string): VideoCategoryVariant | null {
  const normalized = (category || '').trim().toLowerCase();
  if (normalized === 'video & social' || normalized === 'video and social') {
    return 'video-social';
  }
  if (normalized === 'motion graphics' || normalized === 'motion graphic') {
    return 'motion-graphic';
  }
  return null;
}

/**
 * Formats byte size into human-readable string (e.g., "14.2 MB").
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Extracts normalized uppercase video format extension from filename or MIME type.
 */
export function getVideoFormat(filename?: string, mimeType?: string): string {
  const extMatch = (filename || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  if (extMatch && extMatch[1]) {
    return extMatch[1].toUpperCase();
  }
  const mime = (mimeType || '').toLowerCase();
  if (mime.includes('quicktime')) return 'MOV';
  if (mime.includes('webm')) return 'WEBM';
  if (mime.includes('mp4')) return 'MP4';
  return 'MP4';
}

/**
 * Validates a video file against supported formats (MP4, MOV, WEBM) and max upload size (100 MB).
 */
export function validateVideoFile(
  file: { name: string; size: number; type?: string },
  maxBytes: number = MAX_VIDEO_UPLOAD_BYTES
): { valid: boolean; error?: string; warning?: string; format?: string } {
  const nameLower = (file.name || '').toLowerCase();
  const extMatch = nameLower.match(/\.([a-z0-9]+)$/);
  const ext = extMatch ? extMatch[1] : '';
  const mime = (file.type || '').toLowerCase();

  const extAllowed = (ALLOWED_VIDEO_EXTENSIONS as readonly string[]).includes(ext);
  const mimeAllowed = (ALLOWED_VIDEO_MIME_TYPES as readonly string[]).includes(mime);

  if (!extAllowed && !mimeAllowed) {
    return {
      valid: false,
      error: `Unsupported video format for "${file.name}". Allowed formats: MP4, MOV, WEBM.`
    };
  }

  if (file.size <= 0) {
    return {
      valid: false,
      error: `"${file.name}" appears to be empty (0 bytes).`
    };
  }

  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return {
      valid: false,
      error: `"${file.name}" is ${formatFileSize(file.size)}, which exceeds the maximum allowed upload size of ${maxMb} MB.`
    };
  }

  const warning =
    file.size > RECOMMENDED_VIDEO_MAX_BYTES
      ? `"${file.name}" (${formatFileSize(file.size)}) is above the recommended 50 MB size; uploading via Cloudinary (up to ${Math.round(maxBytes / (1024 * 1024))} MB supported).`
      : undefined;

  return {
    valid: true,
    warning,
    format: getVideoFormat(file.name, file.type)
  };
}

/**
 * Computes human-friendly aspect ratio label from pixel dimensions.
 */
export function computeAspectRatioLabel(width?: number, height?: number): string {
  if (!width || !height || width <= 0 || height <= 0) return '16:9';
  const ratio = width / height;

  if (Math.abs(ratio - 16 / 9) <= 0.08) return '16:9';
  if (Math.abs(ratio - 9 / 16) <= 0.08) return '9:16';
  if (Math.abs(ratio - 1) <= 0.05) return '1:1';
  if (Math.abs(ratio - 4 / 3) <= 0.06) return '4:3';
  if (Math.abs(ratio - 3 / 4) <= 0.06) return '3:4';
  if (Math.abs(ratio - 4 / 5) <= 0.05) return '4:5';
  if (Math.abs(ratio - 21 / 9) <= 0.1) return '21:9';

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const w = Math.round(width);
  const h = Math.round(height);
  const divisor = gcd(w, h) || 1;
  const rw = Math.round(w / divisor);
  const rh = Math.round(h / divisor);
  if (rw <= 32 && rh <= 32) {
    return `${rw}:${rh}`;
  }
  return `${ratio.toFixed(2)}:1`;
}

/**
 * Returns orientation classification for responsive player presentation.
 */
export function getVideoOrientation(
  width?: number,
  height?: number,
  aspectRatio?: string
): 'landscape' | 'portrait' | 'square' {
  if (width && height && width > 0 && height > 0) {
    const ratio = width / height;
    if (Math.abs(ratio - 1) <= 0.06) return 'square';
    return ratio > 1 ? 'landscape' : 'portrait';
  }
  if (aspectRatio) {
    const clean = aspectRatio.trim();
    if (clean === '1:1') return 'square';
    if (clean === '9:16' || clean === '3:4' || clean === '4:5' || clean === '2:3') return 'portrait';
    const parts = clean.split(':').map(Number);
    if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
      const ratio = parts[0] / parts[1];
      if (Math.abs(ratio - 1) <= 0.06) return 'square';
      return ratio > 1 ? 'landscape' : 'portrait';
    }
  }
  return 'landscape';
}

/**
 * Generates an instant JPEG poster thumbnail URL from a Cloudinary video URL.
 */
export function getCloudinaryVideoPosterUrl(videoUrl?: string): string | undefined {
  if (!videoUrl || !videoUrl.includes('res.cloudinary.com') || !videoUrl.includes('/video/upload/')) {
    return undefined;
  }
  const withTransform = videoUrl.replace('/video/upload/', '/video/upload/so_0,f_jpg,q_auto/');
  return withTransform.replace(/\.(mp4|mov|webm|m4v|ogv)(\?.*)?$/i, '.jpg$2');
}

/**
 * Generates an H.264 MP4 delivery URL from Cloudinary for broad browser playback
 * when the original uploaded asset is MOV or another container format.
 */
export function getCloudinaryMp4PlaybackUrl(videoUrl?: string): string | undefined {
  if (!videoUrl || !videoUrl.includes('res.cloudinary.com') || !videoUrl.includes('/video/upload/')) {
    return undefined;
  }
  if (/\.mp4(\?.*)?$/i.test(videoUrl)) {
    return undefined;
  }
  const withTransform = videoUrl.replace('/video/upload/', '/video/upload/f_mp4,vc_auto,q_auto/');
  return withTransform.replace(/\.(mov|webm|m4v|ogv)(\?.*)?$/i, '.mp4$2');
}

/**
 * Extracts natural width, height, and duration of a local video File using a detached <video> element.
 * Gracefully resolves to empty metadata if the browser cannot decode the container locally (e.g. MOV).
 */
export function extractLocalVideoMetadata(
  file: File
): Promise<{ width?: number; height?: number; duration?: number }> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve({});
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    let settled = false;
    const finish = (meta: { width?: number; height?: number; duration?: number }) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute('src');
      video.load();
      resolve(meta);
    };

    const timer = window.setTimeout(() => finish({}), 5000);

    video.onloadedmetadata = () => {
      window.clearTimeout(timer);
      finish({
        width: video.videoWidth || undefined,
        height: video.videoHeight || undefined,
        duration: Number.isFinite(video.duration) ? Math.round(video.duration * 10) / 10 : undefined
      });
    };

    video.onerror = () => {
      window.clearTimeout(timer);
      finish({});
    };

    video.src = objectUrl;
  });
}
