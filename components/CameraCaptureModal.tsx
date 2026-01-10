import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IconCamera, IconRefresh, IconX, IconCheck } from './Icons';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob) => void;
}

const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ isOpen, onClose, onCapture }) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setCapturedImage(null);
    if (streamRef.current) {
      stopCamera();
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      let message =
        'Could not access camera. Please check your browser settings and grant permission.';
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          message =
            'Camera access was denied. To use this feature, please enable camera permissions for this site in your browser settings.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          message =
            'No camera was found on your device. Please ensure one is connected and enabled.';
        }
      }
      setError(message);
    }
  }, [stopCamera]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
      setError(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const imageUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageUrl);
        stopCamera();
      }
    }
  };

  const handleRetake = () => {
    startCamera();
  };

  const handleUsePhoto = () => {
    if (canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          onCapture(blob);
        }
      }, 'image/jpeg');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-video bg-black flex items-center justify-center rounded-t-lg">
          {error ? (
            <div className="p-8 text-center text-white">
              <IconCamera className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-semibold text-red-400">Camera Access Error</h3>
              <p className="text-gray-300 mt-2">{error}</p>
            </div>
          ) : capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-contain rounded-t-lg"
            />
          ) : (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full rounded-t-lg" />
          )}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/80 z-20"
          >
            <IconX className="w-6 h-6" />
          </button>
        </div>

        {!error && (
          <div className="p-4 flex justify-center items-center">
            {capturedImage ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={handleRetake}
                  className="flex items-center gap-2 px-4 py-2 text-lg font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700"
                >
                  <IconRefresh className="w-6 h-6" /> Retake
                </button>
                <button
                  onClick={handleUsePhoto}
                  className="flex items-center gap-2 px-4 py-2 text-lg font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                >
                  <IconCheck className="w-6 h-6" /> Use Photo
                </button>
              </div>
            ) : (
              <button
                onClick={handleCapture}
                className="p-4 bg-white rounded-full text-primary-600 hover:bg-gray-200"
              >
                <IconCamera className="w-8 h-8" />
              </button>
            )}
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default CameraCaptureModal;
