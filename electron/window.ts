import {BrowserWindow} from 'electron'
import { join } from 'path'

export const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Creates the main window of the app
 * loads the preload script in './preload.js'
 * for development mood, loads the url at 'http://localhost:5173' 
 * @param width the width of the window
 * @param height the height of the window
 * @returns the initiated browser window
 */
export function createMainWindow(width: number, height: number) : BrowserWindow {
    const mainWindow = new BrowserWindow({
        width: width,
        height: height,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: join(__dirname, 'preload.js') // __dirname is available in CommonJS
        }
    });

    if (IS_DEV) {
        mainWindow.loadURL('http://localhost:5173')
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadFile(join(__dirname, '../dist/index.html'))
    }
    return mainWindow;
};
