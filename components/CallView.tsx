import React, { useRef, useEffect, useState } from 'react';
import { IconMic, IconMicOff, IconVideo, IconVideoOff, IconPhoneOff } from './Icons';

interface CallViewProps {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    onEnd: () => void;
    onMute: (type: 'audio' | 'video') => void;
    onSwitchCamera?: () => void;
    isMuted: { audio: boolean; video: boolean };
}

const CallView: React.FC<CallViewProps> = ({ localStream, remoteStream, onEnd, onMute, onSwitchCamera, isMuted }) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    return (
        <div className="fixed inset-0 bg-black flex flex-col">
            <div className="flex-1 relative">
                {remoteStream ? (
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <p className="text-white">Connecting...</p>
                    </div>
                )}
                {localStream && (
                    <video
                        ref={localVideoRef}
                        autoPlay playsInline muted
                        className="absolute top-4 right-4 w-32 h-24 rounded-lg border-2 border-white"
                    />
                )}
            </div>
            <div className="p-4 flex justify-center space-x-4">
                <button
                    onClick={() => onMute('audio')}
                    className={`p-4 rounded-full ${isMuted.audio ? 'bg-red-500' : 'bg-gray-600'} text-white`}
                    aria-label={isMuted.audio ? 'Unmute microphone' : 'Mute microphone'}
                >
                    {isMuted.audio ? <IconMicOff className="w-6 h-6" /> : <IconMic className="w-6 h-6" />}
                </button>
                <button
                    onClick={() => onMute('video')}
                    className={`p-4 rounded-full ${isMuted.video ? 'bg-red-500' : 'bg-gray-600'} text-white`}
                    aria-label={isMuted.video ? 'Turn on camera' : 'Turn off camera'}
                >
                    {isMuted.video ? <IconVideoOff className="w-6 h-6" /> : <IconVideo className="w-6 h-6" />}
                </button>
                {onSwitchCamera && (
                    <button
                        onClick={onSwitchCamera}
                        className="p-4 rounded-full bg-gray-600 text-white"
                        aria-label="Switch camera"
                    >
                        <IconVideo className="w-6 h-6" />
                    </button>
                )}
                <button
                    onClick={onEnd}
                    className="p-4 rounded-full bg-red-500 text-white"
                    aria-label="End call"
                >
                    <IconPhoneOff className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export default CallView;
