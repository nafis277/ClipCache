/// <reference types="vite/client" />
declare global {
    interface Window {
        clipboardAPI: {
            onClipboardUpdate: (callback: (text: ClipboardContent) => void) => void;
        };
    }
}

export {}