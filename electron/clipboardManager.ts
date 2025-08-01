import { BrowserWindow, clipboard } from "electron";
import { saveClipboardContent, getMostRecent } from "./clipboardHistory";
import { type ClipboardContent } from "../shared/types";
// Stores the last seen HTML content to avoid duplicate entries.
let lastClipboardHTML: string | undefined = undefined; 

/**
 * Starts watching the system clipboard for changes in background.
 * 
 * This function checks the clipboard every second. If new HTML content is detected
 * (i.e., different from the last seen HTML), it creates a new `ClipboardContent` object,
 * saves it to persistent history, and sends the new content to the renderer process (if multiple windows exist, it is sent to all of them).
 * 
 * @returns (A promise of) `NodeJS.Timeout` object representing the polling interval
 */
export async function startBackgroundClipBoardWatcher(): Promise<NodeJS.Timeout> {
    if (lastClipboardHTML === undefined) {
        lastClipboardHTML = (await getMostRecent()).html;
    }

    return setInterval(() => {
        const currentHTML = clipboard.readHTML();
        const currentText = clipboard.readText();
        if (currentHTML && currentHTML !== lastClipboardHTML) {
            lastClipboardHTML = currentHTML;
            const content: ClipboardContent = {
                text: currentText,
                html: currentHTML,
                timestamp: Date.now(),
                tags: [],
            };
            saveClipboardContent(content);
            const allWindows = BrowserWindow.getAllWindows();
            allWindows.forEach(win => {
                if (!win.isDestroyed() && win.webContents) {
                    try {
                        win.webContents.send('clipboard-update', {
                            text: currentText,
                            html: currentHTML,
                            timestamp: Date.now(),
                            tags: [],
                        });
                    } catch {
                        console.log('No valid windows found, copied content saved in background.');
                    }
                }
            });
        }
        
    }, 1000); // Check every second
}