// Chỉ dùng unsigned upload preset. Không bao giờ đặt API key hay API secret ở đây.
// Thư mục lưu ảnh (chat-th06) được cấu hình sẵn trong preset trên Cloudinary.
export const cloudinaryConfig = {
  cloudName: 'cdzfxgll',
  uploadPreset: 'chat_th06_unsigned',
};

export const cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;
