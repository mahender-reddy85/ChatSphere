import { toast } from '../hooks/toastService';

export const uploadFile = async (
  file: File,
  roomId: string,
  messageId: string
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('roomId', roomId);
  formData.append('messageId', messageId);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('File upload error:', error);
    toast.error('Failed to upload file');
    throw error;
  }
};

export const captureImage = async (video: HTMLVideoElement): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to capture image'));
        }
      },
      'image/jpeg',
      0.9
    );
  });
};
