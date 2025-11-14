
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { app } from './firebase';

const storage = getStorage(app, 'gs://media_storage_001');

/**
 * Uploads an image to Firebase Storage and returns the download URL.
 * @param tenantId The ID of the tenant.
 * @param base64Image The image encoded in base64.
 * @param fileName The name of the image with its extension.
 * @returns The download URL of the uploaded image.
 */
export async function uploadImageAndGetURL(tenantId: string, base64Image: string, fileName: string): Promise<string> {
  const storageRef = ref(storage, `profile_images/${fileName}`);

  // Upload the image
  await uploadString(storageRef, base64Image, 'data_url');

  // Get the download URL
  const downloadURL = await getDownloadURL(storageRef);

  return downloadURL;
}
