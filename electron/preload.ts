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

    getBatch: (start: number, size: number) => ipcRenderer.invoke('get-batch', start, size),
    getTotal: () => ipcRenderer.invoke('get-total'),
    deleteClipboardEntry: (timestamp: number) => ipcRenderer.invoke('delete-clipboard-entry', timestamp),
});