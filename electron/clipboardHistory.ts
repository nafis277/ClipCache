import { app } from "electron";
import path from "path";
import fs from "fs/promises";
import { type ClipboardContent } from "./clipboardManager";

/**
 * Directory where clipboard history is stored as individual JSON files.
 */
export const HISTORY_DIR = path.join(app.getPath('userData'), 'clipboard-history');

/**
 * In-memory cache storing file names in reverse chronological order (most recent first).
 */
let cachedAllFilesOrdered: string[] = [];

/**
 * Whether the file list cache has been initialized.
 */
let cacheInitialized = false;

/**
 * Initializes the in-memory cache of clipboard history filenames.
 * Ensures HISTORY_DIR exists, and fills the cache with sorted filenames.
 */
async function initializeCache(): Promise<void> {
    if (!cacheInitialized) {
        await fs.mkdir(HISTORY_DIR, { recursive: true });
        const files = await fs.readdir(HISTORY_DIR);
        cachedAllFilesOrdered = files
            .filter(f => f.endsWith('.json'))
            .sort()
            .reverse();
        cacheInitialized = true;
    }
}

/**
 * Saves a clipboard content entry as a JSON file using its timestamp as the filename.
 * Also prepends the filename to the in-memory cache.
 *
 * @param content - The clipboard content to save (must include `text`, `html`, and `timestamp`).
 * @returns A promise that resolves when the file is written.
 */
export async function saveClipboardContent(content: ClipboardContent): Promise<void> {
    await initializeCache();
    const filePath = path.join(HISTORY_DIR, `${content.timestamp}.json`);
    await fs.writeFile(filePath, JSON.stringify(content));
    cachedAllFilesOrdered.unshift(`${content.timestamp}.json`);
}

/**
 * Lists clipboard history filenames, optionally filtering them by a text search query.
 *
 * @param searchQuery - Optional. If provided, only files whose `text` field includes the query are returned.
 * @returns A promise resolving to an array of matching filenames (sorted by recency).
 */
export async function listHistoryFilenames(searchQuery?: string): Promise<string[]> {
    await initializeCache();

    if (!searchQuery) {
        return cachedAllFilesOrdered;
    }

    const loweredQuery = searchQuery.toLowerCase();

    const matches: Array<string | undefined> = await Promise.all(
        cachedAllFilesOrdered.map(async (filename) => {
            try {
                const raw = await fs.readFile(path.join(HISTORY_DIR, filename), 'utf-8');
                const item: ClipboardContent = JSON.parse(raw);
                return item.text.toLowerCase().includes(loweredQuery) ? filename : undefined;
            } catch {
                return undefined;
            }
        })
    );
    return matches.filter(f => f !== undefined);
}

/**
 * Loads the most recent clipboard content entry, optionally filtered by a search query.
 *
 * @param searchQuery Optional text filter applied to the `text` field.
 * @returns A promise resolving to the most recent matching clipboard entry,
 *          or a default empty entry if none match.
 */
export async function getMostRecent(searchQuery?: string): Promise<ClipboardContent> {
    const files = await listHistoryFilenames(searchQuery);
    if (files.length === 0) {
        return { text: '', html: '', timestamp: 0 };
    }

    const raw = await fs.readFile(path.join(HISTORY_DIR, files[0]), 'utf-8');
    return JSON.parse(raw);
}

/**
 * Loads a batch of clipboard history entries, optionally filtered by search text.
 *
 * @param startIndex The index to start from (0-based).
 * @param batchSize The number of entries to load.
 * @param searchQuery Optional. Filters entries whose `text` field includes this string.
 * @returns A promise resolving to an array of ClipboardContent entries.
 */
export async function loadClipboardBatch(
    startIndex: number,
    batchSize: number,
    searchQuery?: string
): Promise<ClipboardContent[]> {
    const filenames = (await listHistoryFilenames(searchQuery)).slice(startIndex, startIndex + batchSize);
    const entries: Array<ClipboardContent | undefined> = await Promise.all(
        filenames.map(async (fname) => {
            try {
                const raw = await fs.readFile(path.join(HISTORY_DIR, fname), 'utf-8');
                return JSON.parse(raw) as ClipboardContent;
            } catch {
                return undefined;
            }
        })
    );
    return entries.filter(item => item !== undefined);
}

/**
 * Returns the number of stored clipboard entries, optionally filtered by search query.
 *
 * @param searchQuery - Optional. Filters entries whose `text` field includes this string.
 * @returns A promise resolving to the count of matching entries.
 */
export async function getTotalEntries(searchQuery?: string): Promise<number> {
    return (await listHistoryFilenames(searchQuery)).length;
}

/**
 * Deletes a specific clipboard entry file, and removes it from the cache.
 *
 * @param timestamp - The timestamp of the clipboard entry (used as filename).
 * @returns A promise that resolves when deletion completes (or is skipped if not found).
 */
export async function deleteClipboardEntry(timestamp: number): Promise<void> {
    await initializeCache();
    const fname = `${timestamp}.json`;
    const filePath = path.join(HISTORY_DIR, fname);

    try {
        await fs.unlink(filePath);
        cachedAllFilesOrdered = cachedAllFilesOrdered.filter(f => f !== fname);
    } catch {
        // File may not exist; ignore silently
    }
}
