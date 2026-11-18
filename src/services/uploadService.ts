import { cloudinaryConfig, cloudinaryUploadUrl } from '../config/cloudinary';

const UPLOAD_TIMEOUT_MS = 30000;

export type LocalImage = { uri: string; type: string; name: string };

// Upload unsigned bằng preset, không dùng API secret. Chỉ trả về secure_url để lưu vào DB.
export async function uploadImage(image: LocalImage): Promise<string> {
  const form = new FormData();
  form.append('file', {
    uri: image.uri,
    type: image.type,
    name: image.name,
  } as unknown as Blob);
  form.append('upload_preset', cloudinaryConfig.uploadPreset);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  try {
    const res = await fetch(cloudinaryUploadUrl, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error('Cloudinary trả về lỗi ' + res.status);
    }
    const json = await res.json();
    if (typeof json.secure_url !== 'string') {
      throw new Error('Cloudinary không trả về secure_url');
    }
    return json.secure_url;
  } finally {
    clearTimeout(timer);
  }
}
