import { app, BrowserWindow } from 'electron'
import { startClipBoardWatcher } from './clipboardManager';
import { createMainWindow } from './window';


let mainWindow: BrowserWindow | undefined = undefined;
let pollInterval: NodeJS.Timeout | undefined = undefined;

/**
 * Initiates the app
 *   - Creates the main window
 *   - Starts the clipboard watcher
 */
function initateApp() {
    mainWindow = createMainWindow(800, 600);
    pollInterval = startClipBoardWatcher(mainWindow); 
}

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


