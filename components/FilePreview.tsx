import { useState, useEffect, useRef } from 'react';
import { formatFileSize, isImage, isVideo, isAudio, getFileIcon } from '../utils/fileUtils';

interface FilePreviewProps {
  file: File | { url: string; name: string; type: string; size?: number };
  onRemove?: () => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  onRemove,
  isUploading = false,
  uploadProgress = 0,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const isUrl = 'url' in file;
  const fileType = isUrl ? file.type : file.type.split('/')[0];
  const fileName = isUrl ? file.name : file.name;
  const fileSize = isUrl ? file.size : file.size;
  const fileUrl = isUrl ? file.url : '';

  useEffect(() => {
    // Create preview for local files
    if (!isUrl) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Clean up the object URL to avoid memory leaks
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } else {
      setPreviewUrl(file.url);
    }
  }, [file, isUrl]);

  const renderPreview = () => {
    if (isImage(file.type)) {
      return (
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
          <img src={previewUrl} alt={fileName} className="w-full h-full object-cover" />
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      );
    }

    if (isVideo(file.type)) {
      return (
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
          <video src={previewUrl} controls className="w-full h-full object-cover" />
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      );
    }

    if (isAudio(file.type)) {
      return (
        <div className="p-4 bg-gray-100 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="text-3xl">{getFileIcon(file.type)}</div>
            <div className="flex-1">
              <div className="font-medium">{fileName}</div>
              <div className="text-sm text-gray-500">
                {fileSize ? formatFileSize(fileSize) : 'Calculating...'}
              </div>
              <audio src={previewUrl} controls className="w-full mt-2" />
            </div>
          </div>
          {isUploading && (
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      );
    }

    // For other file types, show a generic preview
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="text-3xl">{getFileIcon(file.type)}</div>
          <div className="flex-1">
            <div className="font-medium truncate">{fileName}</div>
            <div className="text-sm text-gray-500">
              {fileSize ? formatFileSize(fileSize) : 'Calculating...'}
            </div>
            {isUploading && (
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
          {onRemove && !isUploading && (
            <button
              onClick={onRemove}
              className="text-gray-400 hover:text-red-500"
              aria-label="Remove file"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mb-4">
      {renderPreview()}
      {isUploading && uploadProgress > 0 && (
        <div className="mt-1 text-xs text-right text-gray-500">
          {Math.round(uploadProgress)}% uploaded
        </div>
      )}
    </div>
  );
};

export default FilePreview;
