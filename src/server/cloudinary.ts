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
}

export interface UploadOptions {
  folder?: string;
  filename?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
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
    resourceType: result.resource_type || (isVideo ? 'video' : 'image')
  };
}

export { cloudinary };
