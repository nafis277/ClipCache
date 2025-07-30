import { BrowserWindow } from 'electron';
import { join } from 'path';

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Creates and returns the main application window.
 *
 * @param width - The desired width of the window.
 * @param height - The desired height of the window.
 * @returns A configured Electron `BrowserWindow` instance.
 *
 * Behavior:
 * - In development mode (`IS_DEV` is true), it loads the local dev server and opens DevTools.
 * - In production mode, it loads the static HTML file from the build output.
 * - Uses a `preload.js` script for secure context bridging.
 */
export function createMainWindow(width: number, height: number): BrowserWindow {
    const mainWindow = new BrowserWindow({
        width: width,
        height: height,
        webPreferences: {
            nodeIntegration: false, 
            contextIsolation: true, 
            preload: join(__dirname, 'preload.js'), 
        }
    });

    if (IS_DEV) {
        mainWindow.loadURL('http://localhost:5173'); 
        mainWindow.webContents.openDevTools();       // Open DevTools for debugging
    } else {
        mainWindow.loadFile(join(__dirname, '../dist/index.html')); 
    }

    return mainWindow;
}
