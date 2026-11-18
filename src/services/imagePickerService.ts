import { PermissionsAndroid, Platform } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  type CameraOptions,
} from 'react-native-image-picker';
import type { LocalImage } from './uploadService';

export type ImageSource = 'camera' | 'library';

export class CameraPermissionError extends Error {
  constructor(readonly blocked: boolean) {
    super('camera-permission');
  }
}

// Cạnh dài tối đa 1024px, giữ tỉ lệ; thư viện tự thu nhỏ nên không cần gói resize riêng.
const OPTIONS: CameraOptions = {
  mediaType: 'photo',
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.8,
  includeBase64: false,
  saveToPhotos: false,
};

async function ensureCameraPermission(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
  );
  if (result !== PermissionsAndroid.RESULTS.GRANTED) {
    throw new CameraPermissionError(
      result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
    );
  }
}

// Trả về null khi người dùng huỷ. Thư viện ảnh dùng Photo Picker nên không cần quyền bộ nhớ.
export async function pickImage(
  source: ImageSource,
): Promise<LocalImage | null> {
  if (source === 'camera') {
    await ensureCameraPermission();
  }
  const result =
    source === 'camera'
      ? await launchCamera(OPTIONS)
      : await launchImageLibrary({ ...OPTIONS, selectionLimit: 1 });
  if (result.didCancel) {
    return null;
  }
  if (result.errorCode === 'permission') {
    throw new CameraPermissionError(false);
  }
  const asset = result.assets?.[0];
  if (result.errorCode || !asset?.uri) {
    throw new Error(result.errorMessage ?? 'Không lấy được ảnh');
  }
  return {
    uri: asset.uri,
    type: asset.type ?? 'image/jpeg',
    name: asset.fileName ?? 'photo-' + Date.now() + '.jpg',
  };
}
