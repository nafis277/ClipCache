import { contextBridge, ipcRenderer } from 'electron';
import { ClipboardContent } from './clipboardManager';

contextBridge.exposeInMainWorld('clipboardAPI', {
    onClipboardUpdate: (callback: (clipboardContent: ClipboardContent) => void) => {
        // Prevent multiple handlers
        ipcRenderer.removeAllListeners('clipboard-update');
        ipcRenderer.on('clipboard-update', (_event, clipboardContent) => {
            callback(clipboardContent);
        });
    },

    getBatch: (start: number, size: number, searchQuery?: string) => ipcRenderer.invoke('get-batch', start, size, searchQuery),
    getTotal: (searchQuery?: string) => ipcRenderer.invoke('get-total', searchQuery),
    deleteClipboardEntry: (timestamp: number) => ipcRenderer.invoke('delete-clipboard-entry', timestamp),
});