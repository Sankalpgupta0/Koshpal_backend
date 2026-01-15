import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.config';

export const profileImageStorage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: 'koshpal/employee-profile',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  }),
});
