import { BrowserWindow, clipboard } from "electron";
import { saveClipboardContent, getMostRecent } from "./clipboardHistory";

/**
 * Represents a single clipboard entry.
 * 
 * @property text - The plain text content of the clipboard.
 * @property html - The HTML content of the clipboard (if available).
 * @property timestamp - The time at which the content was copied, in milliseconds since epoch.
 */
export type ClipboardContent = {
    text: string,
    html: string,
    timestamp: number,
};

// Stores the last seen HTML content to avoid duplicate entries.
let lastHTML = getMostRecent().html;

/**
 * Starts watching the system clipboard for changes.
 * 
 * This function checks the clipboard every second. If new HTML content is detected
 * (i.e., different from the last seen HTML), it creates a new `ClipboardContent` object,
 * saves it to persistent history, and sends the new content to the renderer process.
 * 
 * @param window - The Electron `BrowserWindow` instance to which clipboard updates will be sent via IPC.
 * @returns A `NodeJS.Timeout` object representing the polling interval, which can be used to stop the watcher using `clearInterval`.
 */
export function startClipBoardWatcher(window: BrowserWindow): NodeJS.Timeout {
    const pollInterval = setInterval(() => {
        const currentHTML = clipboard.readHTML();
        const currentText = clipboard.readText();
        if (currentHTML && currentHTML !== lastHTML) {
            lastHTML = currentHTML;
            const content: ClipboardContent = {
                text: currentText,
                html: currentHTML,
                timestamp: Date.now(),
            };
            saveClipboardContent(content);
            window.webContents.send('clipboard-update', content);
        }
    }, 1000); // every 1 second

    return pollInterval;
}
