import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Room, User } from '../types';
import { MOCK_USERS } from '../constants';
import Avatar from './Avatar';
import { IconMic, IconMicOff, IconVideo, IconVideoOff, IconPhoneOff, IconScreenShare } from './Icons';
import { toast } from '../hooks/useToast';

interface VideoCallModalProps {
    room: Room;
    currentUser: User;
    onLeaveCall: () => void;
}

const getGridClasses = (count: number) => {
    if (count <= 1) return 'grid-cols-1 grid-rows-1';
    if (count === 2) return 'grid-cols-1 grid-rows-2';
    if (count === 3 || count === 4) return 'grid-cols-2 grid-rows-2';
    if (count === 5 || count === 6) return 'grid-cols-3 grid-rows-2';
    // Add more cases for larger calls if needed
    return 'grid-cols-3 grid-rows-3';
};

const VideoCallModal: React.FC<VideoCallModalProps> = ({ room, currentUser, onLeaveCall }) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const screenVideoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);

    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    
    const stopScreenShare = useCallback(() => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }
        setIsScreenSharing(false);
        if (screenVideoRef.current) {
            screenVideoRef.current.srcObject = null;
        }
    }, []);

    useEffect(() => {
        const startStream = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                streamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing media devices:", err);
                toast.error("Could not access camera and microphone. Please check permissions.");
                onLeaveCall();
            }
        };

        startStream();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            stopScreenShare();
        };
    }, [onLeaveCall, stopScreenShare]);

    const toggleMic = () => {
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMicMuted(prev => !prev);
        }
    };
    
    const toggleCamera = () => {
        if (streamRef.current) {
            streamRef.current.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsCameraOff(prev => !prev);
        }
    };
    
    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            stopScreenShare();
        } else {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                screenStreamRef.current = stream;

                if (screenVideoRef.current) {
                    screenVideoRef.current.srcObject = stream;
                }
                
                stream.getVideoTracks()[0].onended = () => {
                    stopScreenShare();
                };

                setIsScreenSharing(true);
            } catch (err) {
                console.error("Error sharing screen:", err);
                // Fix: Handle the specific error when the user denies permission.
                if (err instanceof DOMException && err.name === 'NotAllowedError') {
                    alert("Screen sharing permission was denied. To share your screen, you must grant permission when prompted.");
                } else {
                    alert("Could not start screen sharing. Please ensure your browser supports this feature and try again.");
                }
            }
        }
    };
    
    const handleLeaveCall = () => {
        stopScreenShare();
        onLeaveCall();
    }

    const participants = room.activeCall?.participants
        .map(id => MOCK_USERS[id] || (id === currentUser.id ? currentUser : null))
        .filter((u): u is User => u !== null) || [];

    const gridClasses = getGridClasses(isScreenSharing ? 1 : participants.length);

    // Fix: Explicitly type `ParticipantTile` as a `React.FC` to resolve TypeScript errors
    // related to the `key` prop when rendering a list of components defined inside another component.
    const ParticipantTile: React.FC<{ participant: User, isLocal: boolean, isThumb: boolean }> = ({ participant, isLocal, isThumb }) => (
        <div className={`relative bg-gray-800 rounded-lg overflow-hidden ${isThumb ? 'w-full aspect-video' : 'w-full h-full'}`}>
            {isLocal ? (
                <>
                    <video ref={localVideoRef} autoPlay muted className={`w-full h-full object-cover ${isCameraOff ? 'hidden' : ''}`} />
                    {isCameraOff && (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900">
                           <Avatar user={participant} size={isThumb ? "md" : "lg"} />
                        </div>
                    )}
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <Avatar user={participant} size={isThumb ? "md" : "lg"} />
                </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-sm px-2 py-1 rounded">
                {participant.name} {isLocal ? '(You)' : ''}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col p-4">
            <div className={`flex-1 flex gap-4 overflow-hidden ${isScreenSharing ? 'flex-col md:flex-row' : ''}`}>
                <div className="flex-1 bg-black rounded-lg overflow-hidden flex items-center justify-center">
                    {isScreenSharing ? (
                        <video ref={screenVideoRef} autoPlay className="w-full h-full object-contain" />
                    ) : (
                        <div className={`w-full h-full grid ${gridClasses} gap-4`}>
                             {participants.map(p => (
                                <ParticipantTile key={p.id} participant={p} isLocal={p.id === currentUser.id} isThumb={false} />
                            ))}
                        </div>
                    )}
                </div>
                {isScreenSharing && (
                    <div className="w-full md:w-60 flex-shrink-0 flex md:flex-col gap-2 overflow-y-auto p-1">
                        {participants.map(p => (
                            <ParticipantTile key={p.id} participant={p} isLocal={p.id === currentUser.id} isThumb={true} />
                        ))}
                    </div>
                )}
            </div>
            
            <div className="flex-shrink-0 flex justify-center items-center pt-4">
                <div className="flex items-center gap-4 bg-gray-800 p-3 rounded-full">
                    <button onClick={toggleMic} className={`p-3 rounded-full ${isMicMuted ? 'bg-red-600' : 'bg-gray-600'} text-white`}>
                        {isMicMuted ? <IconMicOff className="w-6 h-6" /> : <IconMic className="w-6 h-6" />}
                    </button>
                    <button onClick={toggleCamera} className={`p-3 rounded-full ${isCameraOff ? 'bg-red-600' : 'bg-gray-600'} text-white`}>
                        {isCameraOff ? <IconVideoOff className="w-6 h-6" /> : <IconVideo className="w-6 h-6" />}
                    </button>
                    <button onClick={toggleScreenShare} className={`p-3 rounded-full ${isScreenSharing ? 'bg-green-600' : 'bg-gray-600'} text-white`}>
                        <IconScreenShare className="w-6 h-6" />
                    </button>
                    <button onClick={handleLeaveCall} className="p-3 rounded-full bg-red-600 text-white">
                        <IconPhoneOff className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoCallModal;