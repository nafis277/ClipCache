import { BrowserWindow, clipboard } from "electron";

export type ClipboardContent = {
    text: string,
    html: string,
};

let lastHTML = '';
export function startClipBoardWatcher(window: BrowserWindow) : NodeJS.Timeout {
    const pollInterval = setInterval(() => {
        const currentHTML = clipboard.readHTML();
        const currentText = clipboard.readText();
        if (currentHTML && currentHTML !== lastHTML) {
            lastHTML = currentHTML;
            const content: ClipboardContent = {
                text: currentText,
                html: currentHTML,
            };

            window.webContents.send('clipboard-update', content);
        }
    }, 1000); // every 1 second
    return pollInterval;
}


