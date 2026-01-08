import React, { useState, useEffect } from 'react';
import type { MessageLocation } from '../types';
import { IconX, IconMapPin } from './Icons';

interface LocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSendLocation: (location: MessageLocation) => void;
}

const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, onSendLocation }) => {
    const [location, setLocation] = useState<MessageLocation | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setStatus('loading');
            setLocation(null);
            setError(null);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                    setStatus('success');
                },
                (err) => {
                    let message = "Could not get your location. Please check your browser or device settings.";
                    if (err.code === err.PERMISSION_DENIED) {
                        message = "Location access was denied. Please enable location permissions for this site.";
                    }
                    setError(message);
                    setStatus('error');
                    console.error("Geolocation error:", err);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }
    }, [isOpen]);

    if (!isOpen) return null;
    
    const staticMapImageUrl = location
        ? `https://maps.wikimedia.org/osm-intl/16/${location.latitude}/${location.longitude}.png?lang=en`
        : '';
        
    const handleSend = () => {
        if (location) {
            onSendLocation(location);
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold dark:text-white">Share Location</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <IconX className="w-5 h-5 text-gray-600 dark:text-gray-300"/>
                    </button>
                </div>
                <div className="p-6 text-center">
                    {status === 'loading' && (
                        <div className="flex flex-col items-center justify-center h-48">
                            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-400">Getting your location...</p>
                        </div>
                    )}
                    {status === 'error' && (
                         <div className="flex flex-col items-center justify-center h-48 text-red-500 dark:text-red-400">
                            <IconMapPin className="w-12 h-12 mb-4" />
                            <p className="font-semibold">Location Error</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    )}
                    {status === 'success' && location && (
                        <div>
                            <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative mb-4">
                                <img src={staticMapImageUrl} alt="Map of current location" className="w-full h-full object-cover" />
                                <IconMapPin className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full text-red-500 w-8 h-8 drop-shadow-lg" />
                            </div>
                             <p className="text-sm text-gray-600 dark:text-gray-400">
                                Lat: {location.latitude.toFixed(5)}, Lon: {location.longitude.toFixed(5)}
                             </p>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 flex justify-end">
                     <button 
                        onClick={handleSend} 
                        disabled={status !== 'success'}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-primary-300 dark:disabled:bg-primary-800"
                    >
                        Send Current Location
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LocationModal;
