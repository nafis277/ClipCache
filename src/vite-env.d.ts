/// <reference types="vite/client" />

declare global {
    interface Window {
        clipboardAPI: {
            getBatch: (start: number, size: number, searchQuery?: SearchQuery) => Promise<ClipboardContent[]>;
            getTotal: (searchQuery?: SearchQuery) => Promise<number>;
            addClipboardTag: (timestamp: number, tag: string) => Promise<void>;
            removeClipboardTag: (timestamp: number, tag: string) => Promise<void>;
            getAllTags: () => Promise<string[]>;
            onClipboardUpdate: (callback: (text: ClipboardContent) => void) => void;
            deleteClipboardEntry: (timestamp: number) => Promise<void>;
            deleteAllEntries: (searchQuery?: SearchQuery) => Promise<void>;
        };
    }
}

export {}