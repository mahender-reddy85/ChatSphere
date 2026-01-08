
import { useState, useEffect, useCallback } from 'react';

// Fix: Export Settings types for use in other components.
type Theme = 'light' | 'dark';

export interface Settings {
    theme: Theme;
    enterToSend: boolean;
    fontSize: number;
}

const getStoredSettings = (): Settings => {
    try {
        const stored = localStorage.getItem('chat_settings');
        if (stored) {
            const parsed = JSON.parse(stored);
            return {
                theme: parsed.theme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
                enterToSend: parsed.enterToSend ?? true,
                fontSize: parsed.fontSize ?? 16,
            };
        }
    } catch (e) {
        console.error("Failed to parse settings from localStorage", e);
    }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return {
        theme: prefersDark ? 'dark' : 'light',
        enterToSend: true,
        fontSize: 16,
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
        document.body.style.fontSize = `${settings.fontSize}px`;
        localStorage.setItem('chat_settings', JSON.stringify(settings));
    }, [settings]);

    const toggleDarkMode = useCallback(() => {
        setSettings(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }));
    }, []);

    const toggleEnterToSend = useCallback(() => {
        setSettings(s => ({ ...s, enterToSend: !s.enterToSend }));
    }, []);

    const setFontSize = useCallback((size: number) => {
        setSettings(s => ({ ...s, fontSize: size }));
    }, []);

    return { settings, toggleDarkMode, toggleEnterToSend, setFontSize };
};
