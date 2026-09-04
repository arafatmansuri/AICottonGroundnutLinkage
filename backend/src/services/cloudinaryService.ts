import { v2 as cloudinary } from 'cloudinary';
import config from '../config';

// Configure Cloudinary once on module load
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export interface SignedUploadParams {
  uploadUrl: string;
  publicId: string;
  signature: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  cloudName: string;
}

/**
 * Generate a signed upload URL for direct browser-to-Cloudinary uploads.
 * The image is placed in the configured folder and is set to auto-delete
 * after 1 hour (via eager transformations are NOT used; deletion is done
 * explicitly by the caller via deleteImage).
 */
export function generateSignedUpload(publicId: string): SignedUploadParams {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = config.cloudinary.uploadFolder;

  const paramsToSign: Record<string, string | number> = {
    folder,
    public_id: publicId,
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    config.cloudinary.apiSecret,
  );

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/image/upload`,
    publicId: `${folder}/${publicId}`,
    signature,
    apiKey: config.cloudinary.apiKey,
    timestamp,
    folder,
    cloudName: config.cloudinary.cloudName,
  };
}

/**
 * Delete an image from Cloudinary by its full public_id.
 */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { invalidate: true });
}
