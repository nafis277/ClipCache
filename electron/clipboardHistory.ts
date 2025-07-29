import { app } from "electron";
import path from "path";
import fs from 'fs';
import { type ClipboardContent } from "./clipboardManager";

export const HISTORY_DIR = path.join(app.getPath('userData'), 'clipboard-history');

export function saveClipboardContent(content: ClipboardContent) {
    const filePath = path.join(HISTORY_DIR, `${content.timestamp}.json`);
    fs.writeFileSync(filePath, JSON.stringify(content));
}

export function listHistoryFilenames(): string[] {
    return fs.readdirSync(HISTORY_DIR).filter(f => f.endsWith('.json')).sort().reverse();
}

export function getMostRecent(): ClipboardContent {
    const files = listHistoryFilenames();
    if (!files.length) {
        return {
            text: '',
            html: '',
            timestamp: 0,
        };
    }
    const raw = fs.readFileSync(path.join(HISTORY_DIR, files[0]), 'utf-8');
    return JSON.parse(raw);
}

export function loadClipboardBatch(startIndex: number, batchSize: number): ClipboardContent[] {
    const filenames = listHistoryFilenames().slice(startIndex, startIndex + batchSize);
    return filenames.map(fname => {
        const raw = fs.readFileSync(path.join(HISTORY_DIR, fname), 'utf-8');
        return JSON.parse(raw);
    });
}

export function getTotalEntries(): number {
    return listHistoryFilenames().length;
}

export function deleteClipboardEntry(timestamp: number): void {
    const filePath = path.join(HISTORY_DIR, `${timestamp}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}