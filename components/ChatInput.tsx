import React, { useState, useRef, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import type { Message, MessageLocation } from '../types';
import type { Settings } from '../hooks/useSettings';
import CreatePollModal from './CreatePollModal';
import CameraCaptureModal from './CameraCaptureModal';
import LocationModal from './LocationModal';
import { IconSend, IconPaperclip, IconX, IconPoll, IconFile, IconCamera, IconMic, IconTrash, IconMapPin } from './Icons';
import { useChat } from '../hooks/useChat';
import { toast } from '../hooks/useToast';

interface ChatInputProps {
  onSendMessage: (payload: { text: string; audio?: { blob: Blob; duration: number }; file?: File, location?: MessageLocation }, editingMessageId?: string) => void;
  onCreatePoll: (poll: { question: string; options: string[], location?: string }) => void;
  isSending: boolean;
  settings: Settings;
  editingMessage: Message | null;
  onCancelEdit: () => void;
  onOpenSettings: () => void;
  replyingMessage: Message | null;
  onCancelReply: () => void;
  currentUser: any;
  room: {
    id: string;
    type: string;
    name: string;
  };
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onCreatePoll, isSending, settings, editingMessage, onCancelEdit, replyingMessage, onCancelReply, currentUser, room }) => {
  const [text, setText] = useState('');
  const [isPollModalOpen, setPollModalOpen] = useState(false);
  const [isCameraModalOpen, setCameraModalOpen] = useState(false);
  const [isLocationModalOpen, setLocationModalOpen] = useState(false);
  const [isAttachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob; duration: number } | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [capturedImage, setCapturedImage] = useState<File | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const recordingIntervalRef = useRef<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const socketRef = useRef<any>(null);
  // Get the current user from the replying message or use a default
  const currentUserId = currentUser?.id;

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? 'https://chatsphere-7t8g.onrender.com' : 'http://localhost:5000');
    const socket = io(backendUrl, {
      transports: ['websocket']
    });
    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleTyping = useCallback((isTyping: boolean) => {
    if (!socketRef.current || !currentUserId || !room?.id) return;
    
    console.log(`Sending typing event:`, { roomId: room.id, userId: currentUserId, isTyping });
    
    socketRef.current.emit('typing', {
      roomId: room.id,
      userId: currentUserId,
      isTyping
    });
  }, [currentUserId, room?.id]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setText(newValue);
    
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Only send typing indicator if there's actual content
    if (newValue.trim() !== '') {
      handleTyping(true);
      
      // Set a timeout to stop the typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = window.setTimeout(() => {
        handleTyping(false);
      }, 2000);
    } else {
      handleTyping(false);
    }
  }, [handleTyping]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text);
      textareaRef.current?.focus();
    } else {
      setText('');
    }
  }, [editingMessage]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`; // Max height of 128px
    }
  }, [text]);
  
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - recordingStartTimeRef.current) / 1000;
        setRecordingDuration(elapsed);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      setRecordingDuration(0);
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  const handleSend = () => {
    // Clear any pending typing indicator timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    // Send stop typing indicator
    handleTyping(false);
    if (recordedAudio) {
      onSendMessage({ text: text.trim(), audio: recordedAudio });
      setRecordedAudio(null);
    } else if (attachedFiles.length > 0) {
      attachedFiles.forEach((file, index) => {
        onSendMessage({ text: index === 0 ? text.trim() : '', file });
      });
      setAttachedFiles([]);
    } else if (capturedImage) {
      onSendMessage({ text: text.trim(), file: capturedImage });
      setCapturedImage(null);
    } else if (text.trim() || editingMessage) {
      onSendMessage({ text: text.trim() });
    }
    setText('');
    setAttachmentMenuOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (settings.enterToSend && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachedFiles(prev => [...prev, ...files]);
    }
    if(fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const handleCameraCapture = (blob: Blob) => {
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setCapturedImage(file);
    setCameraModalOpen(false);
  };
  
  const handleLocationSend = (location: MessageLocation) => {
      onSendMessage({ text: '', location });
      setLocationModalOpen(false);
  };

  const handleRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
          const duration = (Date.now() - recordingStartTimeRef.current) / 1000;
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setRecordedAudio({ blob: audioBlob, duration });
          stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
        };
        
        recordingStartTimeRef.current = Date.now();
        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        toast.error("Could not access microphone. Please check permissions.");
      }
    }
  };
  
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const discardRecording = () => {
    setRecordedAudio(null);
  };

  return (
    <>
      <div className="flex-shrink-0 p-2 md:p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        {editingMessage && (
          <div className="flex justify-between items-center mb-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">Editing Message</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{editingMessage.text}</p>
            </div>
            <button onClick={onCancelEdit} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
              <IconX className="w-4 h-4 text-gray-500 dark:text-gray-300"/>
            </button>
          </div>
        )}
        {replyingMessage && (
          <div className="flex justify-between items-center mb-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Replying to {replyingMessage.author.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{replyingMessage.text}</p>
            </div>
            <button onClick={onCancelReply} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
              <IconX className="w-4 h-4 text-gray-500 dark:text-gray-300"/>
            </button>
          </div>
        )}
        {isRecording && (
          <div className="flex justify-between items-center mb-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">Recording...</p>
            </div>
            <p className="text-sm font-mono text-red-600 dark:text-red-400">{formatDuration(recordingDuration)}</p>
          </div>
        )}
        {recordedAudio && (
          <div className="flex justify-between items-center mb-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">Voice Message Ready</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Duration: {formatDuration(recordedAudio.duration)}</p>
            </div>
            <button onClick={discardRecording} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
              <IconX className="w-4 h-4 text-gray-500 dark:text-gray-300"/>
            </button>
          </div>
        )}
        {attachedFiles.length > 0 && (
          <div className="mb-2 space-y-2">
            {attachedFiles.map((file, index) => (
              <div key={index} className="flex justify-between items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">File Attached</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]">{file.name}</p>
                </div>
                <button onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== index))} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                  <IconX className="w-4 h-4 text-gray-500 dark:text-gray-300"/>
                </button>
              </div>
            ))}
          </div>
        )}
        {capturedImage && (
          <div className="flex justify-between items-center mb-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">Photo Captured</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{capturedImage.name}</p>
            </div>
            <button onClick={() => setCapturedImage(null)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
              <IconX className="w-4 h-4 text-gray-500 dark:text-gray-300"/>
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <div className="relative">
            <button onClick={() => setAttachmentMenuOpen(o => !o)} className="p-2 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-400">
              <IconPaperclip className="w-6 h-6" />
            </button>
            {isAttachmentMenuOpen && (
               <div className="absolute bottom-full mb-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border dark:border-gray-600 p-2 z-10">
                   <button onClick={() => { fileInputRef.current?.click(); setAttachmentMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-sm">
                       <IconFile className="w-4 h-4" /> Attach File
                   </button>
                   <button onClick={() => { setCameraModalOpen(true); setAttachmentMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-sm">
                       <IconCamera className="w-4 h-4" /> Use Camera
                   </button>
                   <button onClick={() => { setPollModalOpen(true); setAttachmentMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-sm">
                       <IconPoll className="w-4 h-4" /> Create Poll
                   </button>
                   <button onClick={() => { setLocationModalOpen(true); setAttachmentMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-sm">
                       <IconMapPin className="w-4 h-4" /> Share Location
                   </button>
               </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={() => handleTyping(false)}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2.5 border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isSending || isRecording}
          />
          <button onClick={handleRecord} disabled={!!recordedAudio} className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-400'} disabled:opacity-50`}>
            <IconMic className="w-6 h-6" />
          </button>
          <button onClick={handleSend} disabled={isSending || (!text.trim() && !editingMessage && !recordedAudio && attachedFiles.length === 0 && !capturedImage)} className="p-2.5 text-white bg-primary-600 rounded-full hover:bg-primary-700 disabled:bg-primary-300 dark:disabled:bg-primary-800 transition-colors">
            <IconSend className="w-6 h-6" />
          </button>
        </div>
      </div>
      <CreatePollModal isOpen={isPollModalOpen} onClose={() => setPollModalOpen(false)} onCreatePoll={onCreatePoll} />
      <CameraCaptureModal isOpen={isCameraModalOpen} onClose={() => setCameraModalOpen(false)} onCapture={handleCameraCapture} />
      <LocationModal isOpen={isLocationModalOpen} onClose={() => setLocationModalOpen(false)} onSendLocation={handleLocationSend} />
    </>
  );
};

export default ChatInput;