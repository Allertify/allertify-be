import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import { logger } from '../utils/logger';

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface CloudinaryDeleteResult {
  result: string;
  deletedCount: number;
}

export class CloudinaryService {
  constructor() {
    // Configure Cloudinary
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
        api_key: process.env.CLOUDINARY_API_KEY || '',
        api_secret: process.env.CLOUDINARY_API_SECRET || '',
    });

    logger.info('Cloudinary service initialized');
  }

  /**
   * Upload image to Cloudinary
   */
  async uploadImage(
    imageBuffer: Buffer,
    options: {
      folder?: string;
      publicId?: string;
      transformation?: any[];
      tags?: string[];
    } = {}
  ): Promise<CloudinaryUploadResult> {
    try {
      const uploadOptions: UploadApiOptions = {
        resource_type: 'image',
        folder: options.folder || 'allertify',
        ...(options.publicId && { public_id: options.publicId }),
        transformation: options.transformation || [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
        tags: options.tags || ['allertify', 'food-safety'],
        overwrite: true,
      };

      // Convert buffer to base64 string
      const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

      const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions ,
          (error, result) => {
            if (error) {
              reject(error as Error);
            } else if (result) {
              resolve({
                publicId: result.public_id,
                url: result.url,
                secureUrl: result.secure_url,
                width: result.width || 0,
                height: result.height || 0,
                format: result.format || '',
                bytes: result.bytes || 0,
              });
            } else {
              reject(new Error('Upload failed with no result'));
            }
          }
        ).end(imageBuffer);
      });

      logger.info(`Image uploaded successfully: ${result.publicId}`);
      return result;

    } catch (error) {
      logger.error('Error uploading image to Cloudinary:', error);
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload image from URL
   */
  async uploadImageFromUrl(
    imageUrl: string,
    options: {
      folder?: string;
      publicId?: string;
      transformation?: any[];
      tags?: string[];
    } = {}
  ): Promise<CloudinaryUploadResult> {
    try {
      const uploadOptions: UploadApiOptions = {
        resource_type: 'image',
        folder: options.folder || 'allertify',
        ...(options.publicId && { public_id: options.publicId }),
        transformation: options.transformation || [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
        tags: options.tags || ['allertify', 'food-safety'],
        overwrite: true,
      };

      const result = await cloudinary.uploader.upload(imageUrl, uploadOptions);

      const uploadResult: CloudinaryUploadResult = {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        width: result.width || 0,
        height: result.height || 0,
        format: result.format || '',
        bytes: result.bytes || 0,
      };

      logger.info(`Image uploaded from URL successfully: ${uploadResult.publicId}`);
      return uploadResult;

    } catch (error) {
      logger.error('Error uploading image from URL to Cloudinary:', error);
      throw new Error(`Failed to upload image from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<CloudinaryDeleteResult> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      
      logger.info(`Image deleted successfully: ${publicId}`);
      return {
        result: result.result,
        deletedCount: result.deleted_count || 0,
      };

    } catch (error) {
      logger.error('Error deleting image from Cloudinary:', error);
      throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get image information
   */
  async getImageInfo(publicId: string) {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      logger.error('Error getting image info from Cloudinary:', error);
      throw new Error(`Failed to get image info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate optimized image URL with transformations
   */
  generateOptimizedUrl(
    publicId: string,
    transformations: any[] = []
  ): string {
    const defaultTransformations = [
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
      { width: 800, height: 600, crop: 'limit' }
    ];

    const allTransformations = [...defaultTransformations, ...transformations];
    
    return cloudinary.url(publicId, {
      transformation: allTransformations,
      secure: true,
    });
  }

  /**
   * Check if Cloudinary is properly configured
   */
  isConfigured(): boolean {
    return !!(process.env.CLOUDINARY_CLOUD_NAME && 
              process.env.CLOUDINARY_API_KEY && 
              process.env.CLOUDINARY_API_SECRET);
  }
}

export default new CloudinaryService();
