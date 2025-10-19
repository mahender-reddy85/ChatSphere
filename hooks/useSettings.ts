
import { useState, useEffect, useCallback } from 'react';

// Fix: Export FontSize and Settings types for use in other components.
export type FontSize = 'font-size-sm' | 'font-size-md' | 'font-size-lg';
type Theme = 'light' | 'dark';

export interface Settings {
    theme: Theme;
    enterToSend: boolean;
}

const getStoredSettings = (): Settings => {
    try {
        const stored = localStorage.getItem('chat_settings');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error("Failed to parse settings from localStorage", e);
    }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return {
        theme: prefersDark ? 'dark' : 'light',
        enterToSend: true,
    };
};

export const useSettings = () => {
    const [settings, setSettings] = useState<Settings>(getStoredSettings);

    useEffect(() => {
        if (settings.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('chat_settings', JSON.stringify(settings));
    }, [settings]);

    const toggleDarkMode = useCallback(() => {
        setSettings(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }));
    }, []);

    const toggleEnterToSend = useCallback(() => {
        setSettings(s => ({ ...s, enterToSend: !s.enterToSend }));
    }, []);

    return { settings, toggleDarkMode, toggleEnterToSend };
};
