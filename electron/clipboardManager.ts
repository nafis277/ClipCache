import { BrowserWindow, clipboard } from "electron";
import { saveClipboardContent, getMostRecent } from "./clipboardHistory";

export type ClipboardContent = {
    text: string,
    html: string,
    timestamp: number,
};

let lastHTML = getMostRecent().html;
export function startClipBoardWatcher(window: BrowserWindow) : NodeJS.Timeout {
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


