import { contextBridge, ipcRenderer } from 'electron';
import { ClipboardContent, SearchQuery } from '../shared/types';

contextBridge.exposeInMainWorld('clipboardAPI', {
    onClipboardUpdate: (callback: (clipboardContent: ClipboardContent) => void) => {
        // Prevent multiple handlers
        ipcRenderer.removeAllListeners('clipboard-update');
        ipcRenderer.on('clipboard-update', (_event, clipboardContent) => {
            callback(clipboardContent);
        });
    },

    getBatch: (start: number, size: number, searchQuery?: SearchQuery) => ipcRenderer.invoke('get-batch', start, size, searchQuery),
    getTotal: (searchQuery?: SearchQuery) => ipcRenderer.invoke('get-total', searchQuery),
    deleteClipboardEntry: (timestamp: number) => ipcRenderer.invoke('delete-clipboard-entry', timestamp),
    addClipboardTag: (timestamp: number, tag: string) => ipcRenderer.invoke('add-tag', timestamp, tag), 
    removeClipboardTag: (timestamp: number, tag: string) => ipcRenderer.invoke('remove-tag', timestamp, tag),
    getAllTags: () => ipcRenderer.invoke('all-tags'),
});