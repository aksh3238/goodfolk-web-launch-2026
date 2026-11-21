import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

// Check if Cloudinary is configured via environment variables
export function isCloudinaryConfigured(): boolean {
  if (process.env.CLOUDINARY_URL) {
    return true;
  }
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

// Initialize configuration if environment variables are present
if (isCloudinaryConfigured()) {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config();
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
  }
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  bytes: number;
  format: string;
  resourceType: string;
  width?: number;
  height?: number;
  duration?: number;
  poster?: string;
}

export interface UploadOptions {
  folder?: string;
  filename?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
}

export const RECOMMENDED_VIDEO_MAX_BYTES = 50 * 1024 * 1024; // 50 MB recommended
export const MAX_VIDEO_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB Cloudinary video limit

export function getCloudinaryVideoPosterUrl(videoUrl?: string): string | undefined {
  if (!videoUrl || !videoUrl.includes('res.cloudinary.com') || !videoUrl.includes('/video/upload/')) {
    return undefined;
  }
  const withTransform = videoUrl.replace('/video/upload/', '/video/upload/so_0,f_jpg,q_auto/');
  return withTransform.replace(/\.(mp4|mov|webm|m4v|ogv)(\?.*)?$/i, '.jpg$2');
}

/**
 * Generates a short-lived signed direct upload payload for uploading videos directly
 * from the Admin Console to Cloudinary CDN (supports up to 100 MB with live upload progress).
 */
export function getCloudinaryVideoUploadSignature(options: { folder?: string } = {}): {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  useFilename: boolean;
  uniqueFilename: boolean;
  maxFileSizeBytes: number;
  recommendedMaxBytes: number;
} {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary cloud storage is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
    );
  }

  const cfg = cloudinary.config();
  const cloudName = cfg.cloud_name || process.env.CLOUDINARY_CLOUD_NAME || '';
  const apiKey = cfg.api_key || process.env.CLOUDINARY_API_KEY || '';
  const apiSecret = cfg.api_secret || process.env.CLOUDINARY_API_SECRET || '';

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Incomplete Cloudinary configuration: missing cloud_name, api_key, or api_secret.');
  }

  const baseFolder = process.env.CLOUDINARY_FOLDER || 'goodfolk';
  const folder = options.folder || `${baseFolder}/portfolio-videos`;
  const timestamp = Math.round(Date.now() / 1000);

  const paramsToSign: Record<string, string | number> = {
    folder,
    timestamp,
    unique_filename: 'true',
    use_filename: 'true'
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  return {
    cloudName,
    apiKey,
    timestamp,
    folder,
    signature,
    useFilename: true,
    uniqueFilename: true,
    maxFileSizeBytes: MAX_VIDEO_UPLOAD_BYTES,
    recommendedMaxBytes: RECOMMENDED_VIDEO_MAX_BYTES
  };
}

/**
 * Streams a raw video Buffer directly to Cloudinary CDN (resource_type: 'video').
 * Never falls back to local disk.
 */
export async function uploadVideoBufferToCloudinary(
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary environment variables are not set. Video uploads require permanent cloud storage.');
  }

  const baseFolder = process.env.CLOUDINARY_FOLDER || 'goodfolk';
  const folder = options.folder || `${baseFolder}/portfolio-videos`;
  const cleanName = (options.filename || 'video')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_');

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'video',
        use_filename: true,
        unique_filename: true,
        filename_override: cleanName,
        overwrite: false
      },
      (err, res) => {
        if (err || !res) {
          reject(err || new Error('Cloudinary returned an empty response for video upload.'));
          return;
        }
        resolve(res);
      }
    );
    uploadStream.end(buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    bytes: result.bytes || buffer.length,
    format: result.format || 'mp4',
    resourceType: result.resource_type || 'video',
    width: result.width,
    height: result.height,
    duration: typeof (result as any).duration === 'number' ? (result as any).duration : undefined,
    poster: getCloudinaryVideoPosterUrl(result.secure_url)
  };
}

/**
 * Uploads a base64 DataURL or buffer directly to Cloudinary.
 * Preserves high quality and returns optimized HTTPS CDN URL.
 */
export async function uploadToCloudinary(
  dataUrlOrBuffer: string,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not set.');
  }

  const folder = options.folder || process.env.CLOUDINARY_FOLDER || 'goodfolk';
  const cleanName = (options.filename || 'asset')
    .replace(/\.[^/.]+$/, '') // strip extension
    .replace(/[^a-zA-Z0-9_-]/g, '_'); // sanitize

  const isVideo = dataUrlOrBuffer.startsWith('data:video');
  const resourceType = options.resourceType || (isVideo ? 'video' : 'auto');

  const uploadOptions: Record<string, any> = {
    folder,
    resource_type: resourceType,
    use_filename: true,
    unique_filename: true,
    filename_override: cleanName,
    overwrite: false
  };

  const result: UploadApiResponse = await cloudinary.uploader.upload(
    dataUrlOrBuffer,
    uploadOptions
  );

  return {
    url: result.secure_url,
    publicId: result.public_id,
    bytes: result.bytes || 0,
    format: result.format || (isVideo ? 'mp4' : 'jpg'),
    resourceType: result.resource_type || (isVideo ? 'video' : 'image'),
    width: result.width,
    height: result.height,
    duration: typeof (result as any).duration === 'number' ? (result as any).duration : undefined,
    poster: (result.resource_type || (isVideo ? 'video' : 'image')) === 'video'
      ? getCloudinaryVideoPosterUrl(result.secure_url)
      : undefined
  };
}

export { cloudinary };
