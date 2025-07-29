/// <reference types="vite/client" />
declare global {
    interface Window {
        clipboardAPI: {
            getBatch: (start: number, size: number) => Promise<ClipboardContent[]>;
            getTotal: () => Promise<number>;
            onClipboardUpdate: (callback: (text: ClipboardContent) => void) => void;
        };
    }
}

export {}