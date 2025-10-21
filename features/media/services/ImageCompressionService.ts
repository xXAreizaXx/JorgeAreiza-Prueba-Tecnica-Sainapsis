import { ImageCompressionService as IImageCompressionService } from '@/core/domain/use-cases/media/ShareImageUseCase';
import * as ImageManipulator from 'expo-image-manipulator';

export class ImageCompressionService implements IImageCompressionService {
  async compressImage(uri: string, quality: number = 0.7): Promise<string> {
    try {
      // Compress and resize image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }], // Resize to max width of 1024px
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return manipulatedImage.uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      // Return original URI if compression fails
      return uri;
    }
  }
}

export const imageCompressionService = new ImageCompressionService();
