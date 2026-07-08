import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

/**
 * Converts a picked image (any URI expo-image-picker/camera returns) into a
 * compressed WebP base64 data URI. WebP typically comes in 25-50% smaller
 * than JPEG at the same visual quality, which matters here because every
 * image in this app is transported/stored as a base64 string (API payloads,
 * MongoDB documents) rather than an uploaded-file URL.
 *
 * @param uri Local URI of the picked/captured image
 * @param options.compress Quality 0-1 (default 0.8)
 * @param options.maxWidth Optional resize cap - downscales large camera photos
 *   before encoding, which usually saves far more than format choice alone
 */
export async function convertToWebP(
  uri: string,
  options?: { compress?: number; maxWidth?: number }
): Promise<string> {
  const actions = options?.maxWidth ? [{ resize: { width: options.maxWidth } }] : [];

  const result = await manipulateAsync(uri, actions, {
    compress: options?.compress ?? 0.8,
    format: SaveFormat.WEBP,
    base64: true,
  });

  if (!result.base64) {
    throw new Error('Failed to generate base64 data for image');
  }

  return `data:image/webp;base64,${result.base64}`;
}
