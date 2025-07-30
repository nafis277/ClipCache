/// <reference types="vite/client" />
declare global {
    interface Window {
        clipboardAPI: {
            getBatch: (start: number, size: number, searchQuery?: string) => Promise<ClipboardContent[]>;
            getTotal: (searchQuery?: string) => Promise<number>;
            onClipboardUpdate: (callback: (text: ClipboardContent) => void) => void;
            deleteClipboardEntry: (timestamp: number) => void;
        };
    }
}

export {}