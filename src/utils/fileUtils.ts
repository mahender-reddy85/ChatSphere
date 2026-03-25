export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (mimeType: string): string => {
  const iconMap: Record<string, string> = {
    // Images
    'image/': '🖼️',
    // Documents
    'application/pdf': '📄',
    'application/msword': '📄',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📄',
    // Spreadsheets
    'application/vnd.ms-excel': '📊',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
    // Presentations
    'application/vnd.ms-powerpoint': '📝',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📝',
    // Archives
    'application/zip': '📦',
    'application/x-rar-compressed': '📦',
    'application/x-7z-compressed': '📦',
    'application/x-tar': '📦',
    'application/x-gzip': '📦',
    // Audio
    'audio/': '🎵',
    // Video
    'video/': '🎥',
    // Default
    default: '📎',
  };

  // Check for specific MIME types first
  if (mimeType in iconMap) {
    return iconMap[mimeType];
  }

  // Check for MIME type prefixes
  for (const [prefix, icon] of Object.entries(iconMap)) {
    if (prefix.endsWith('/') && mimeType.startsWith(prefix)) {
      return icon;
    }
  }

  return iconMap.default;
};

export const isImage = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};

export const isVideo = (mimeType: string): boolean => {
  return mimeType.startsWith('video/');
};

export const isAudio = (mimeType: string): boolean => {
  return mimeType.startsWith('audio/');
};

export const isDocument = (mimeType: string): boolean => {
  return [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
  ].includes(mimeType);
};

export const isArchive = (mimeType: string): boolean => {
  return [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/x-gzip',
  ].includes(mimeType);
};

export const getFileType = (mimeType: string): string => {
  if (isImage(mimeType)) return 'image';
  if (isVideo(mimeType)) return 'video';
  if (isAudio(mimeType)) return 'audio';
  if (isDocument(mimeType)) return 'document';
  if (isArchive(mimeType)) return 'archive';
  return 'other';
};
