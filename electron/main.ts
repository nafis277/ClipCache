import { app, BrowserWindow, ipcMain } from 'electron'
import { startClipBoardWatcher } from './clipboardManager';
import { createMainWindow } from './window';
import { HISTORY_DIR, getTotalEntries, loadClipboardBatch, deleteClipboardEntry} from './clipboardHistory';
import fs from 'fs';

let mainWindow: BrowserWindow | undefined = undefined;
let pollInterval: NodeJS.Timeout | undefined = undefined;

/**
 * Initiates the app
 *   - Creates the directory to store clipboard contents if it doesn't exist yet
 *   - Creates the main window
 *   - Starts the clipboard watcher
 */
function initateApp() {
    if (!fs.existsSync(HISTORY_DIR)) {
        fs.mkdirSync(HISTORY_DIR);
    } 
    console.log(fs.existsSync(HISTORY_DIR));
    mainWindow = createMainWindow(1000, 800);
    pollInterval = startClipBoardWatcher(mainWindow); 
}

// Handler for loading a batch of clipboard items
ipcMain.handle('get-batch', (_e, start: number, size: number, searchQuery?: string) => loadClipboardBatch(start, size, searchQuery));

// Handler for getting the total number of entries stored
ipcMain.handle('get-total', (_e, searchQuery?: string) => getTotalEntries(searchQuery));

// Handler for deleting a clipboard item
ipcMain.handle('delete-clipboard-entry', (_e, timestamp: number) => deleteClipboardEntry(timestamp));

app.whenReady().then(() => {
    initateApp();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            initateApp();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        if (pollInterval !== undefined) {
            pollInterval.close();
        }
        app.quit();
    }
});


