import { app } from "electron";
import path from "path";
import fs from 'fs';
import { type ClipboardContent } from "./clipboardManager";


/**
 * Directory where clipboard history is stored as JSON files.
 */
export const HISTORY_DIR = path.join(app.getPath('userData'), 'clipboard-history');

/**
 * Saves a clipboard content entry as a JSON file using its timestamp as filename.
 * 
 * @param content The clipboard content to save, containing text, html, and timestamp.
 */
export function saveClipboardContent(content: ClipboardContent) {
    const filePath = path.join(HISTORY_DIR, `${content.timestamp}.json`);
    fs.writeFileSync(filePath, JSON.stringify(content));
}


/**
 * Lists all clipboard history filenames, optionally filtering them by a text search query.
 * 
 * @param searchQuery Optional. If provided, only filenames whose content includes the query in the `text` field will be returned.
 * @returns An array of filenames (most recent first) matching the query, or all if no query is given.
 */
export function listHistoryFilenames(searchQuery?: string): string[] {
    const customFilter = (f: string) => {
        if (!searchQuery) {
            return true;
        }
        try {
            const item: ClipboardContent = JSON.parse(fs.readFileSync(path.join(HISTORY_DIR, f), 'utf-8'));
            return item.text.toLowerCase().includes(searchQuery.toLowerCase());
        } catch {
            return false;
        }
    }
    return fs.readdirSync(HISTORY_DIR)
                .filter(f => f.endsWith('.json'))
                .filter(customFilter)
                .sort()
                .reverse();
}

/**
 * Returns the most recent clipboard entry that optionally matches a search query.
 * 
 * @param searchQuery Optional text to filter entries by their `text` field.
 * @returns The most recent matching clipboard entry. If none found, returns an empty entry.
 */
export function getMostRecent(searchQuery?: string): ClipboardContent {
    const files = listHistoryFilenames(searchQuery);
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

/**
 * Loads a batch of clipboard history entries, optionally filtered by a search query.
 * 
 * @param startIndex The index (0-based) to start loading from.
 * @param batchSize Number of entries to load.
 * @param searchQuery Optional text filter applied to the `text` field of entries.
 * @returns An array of clipboard content objects.
 */
export function loadClipboardBatch(startIndex: number, batchSize: number,
                                    searchQuery?: string): ClipboardContent[] {
    const filenames = listHistoryFilenames(searchQuery).slice(startIndex, startIndex + batchSize);
    return filenames.map(fname => {
        const raw = fs.readFileSync(path.join(HISTORY_DIR, fname), 'utf-8');
        return JSON.parse(raw);
    });
}

/**
 * Returns the total number of clipboard entries, optionally filtered by a search query.
 * 
 * @param searchQuery - Optional text to filter entries by their `text` field.
 * @returns The number of matching entries.
 */
export function getTotalEntries(searchQuery?: string): number {
    return listHistoryFilenames(searchQuery).length;
}

/**
 * Deletes a specific clipboard history entry by its timestamp.
 * 
 * @param timestamp - The timestamp of the clipboard entry to delete (used as the filename).
 */
export function deleteClipboardEntry(timestamp: number): void {
    const filePath = path.join(HISTORY_DIR, `${timestamp}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}