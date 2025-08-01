import { app } from "electron";
import path from "path";
import fs from "fs/promises";
import { type ClipboardContent, type SearchQuery } from "../shared/types";

/**
 * Directory where clipboard history is stored as individual JSON files.
 */
export const HISTORY_DIR = path.join(app.getPath('userData'), 'clipboard-history');

/**
 * Stores all the tags
 */
const TAGS_FILE = path.join(HISTORY_DIR, 'tags.json');

/**
 * In-memory cache storing file names in reverse chronological order (most recent first).
 */
let cachedAllFilesOrdered: string[] = [];

/**
 * In-memory cache storing the available tags
 */
let cachedTags: string[] = []; 

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
        
        // Initialize file cache
        const files = await fs.readdir(HISTORY_DIR);
        cachedAllFilesOrdered = files
            .filter(f => f.endsWith('.json') && f !== 'tags.json') // Exclude tags.json
            .sort()
            .reverse();
        
        // Initialize tags cache
        await loadTagsFromFile();
        
        cacheInitialized = true;
    }
}

/**
 * Load tags from the tags.json file
 * @returns A promise that resolves after loading the tags to cachedTags
 */
async function loadTagsFromFile(): Promise<void> {
    try {
        const tagsData = await fs.readFile(TAGS_FILE, 'utf-8');
        const tags: string[] = JSON.parse(tagsData);
        cachedTags = tags;
    } catch {
        // File doesn't exist or is corrupted, start with empty tags
        cachedTags = [];
        
        // Create the tags file with empty array
        try {
            await fs.writeFile(TAGS_FILE, JSON.stringify([]));
            console.log('Created new tags.json file');
        } catch (writeError) {
            console.error('Failed to create tags.json file:', writeError);
        }
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
 * Lists clipboard history filenames, optionally filtering them by a query.
 *
 * @param searchQuery Optional parameter to filter entries by matching contents in it
 * @returns A promise resolving to an array of matching filenames (sorted by recency).
 */
export async function listHistoryFilenames(searchQuery?: SearchQuery): Promise<string[]> {
    await initializeCache();

    if (!searchQuery || (!searchQuery.text && !searchQuery.tag)) {
        return cachedAllFilesOrdered;
    }

    const text = searchQuery.text.toLowerCase();
    const tag = searchQuery.tag;
    const matches: Array<string | undefined> = await Promise.all(
        cachedAllFilesOrdered.map(async (filename) => {
            try {
                const raw = await fs.readFile(path.join(HISTORY_DIR, filename), 'utf-8');
                const item: ClipboardContent = JSON.parse(raw);
                return  (!text || item.text.toLowerCase().includes(text)) &&
                        (!tag || item.tags.indexOf(tag) !== -1) ? filename : undefined;
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
 * @param searchQuery Optional parameter to filter entries by matching contents in it
 * @returns A promise resolving to the most recent matching clipboard entry,
 *          or a default empty entry if none match.
 */
export async function getMostRecent(searchQuery?: SearchQuery): Promise<ClipboardContent> {
    const files = await listHistoryFilenames(searchQuery);
    if (files.length === 0) {
        return { text: '', html: '', timestamp: 0, tags: [] };
    }

    const raw = await fs.readFile(path.join(HISTORY_DIR, files[0]), 'utf-8');
    return JSON.parse(raw);
}

/**
 * Loads a batch of clipboard history entries, optionally filtered by search query.
 *
 * @param startIndex The index to start from (0-based).
 * @param batchSize The number of entries to load.
 * @param searchQuery Optional parameter to filter entries by matching contents in it
 * @returns A promise resolving to an array of ClipboardContent entries.
 */
export async function loadClipboardBatch(
    startIndex: number,
    batchSize: number,
    searchQuery?: SearchQuery
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
 * @param searchQuery Optional parameter to filter entries by matching contents in it
 * @returns A promise resolving to the count of matching entries.
 */
export async function getTotalEntries(searchQuery?: SearchQuery): Promise<number> {
    return (await listHistoryFilenames(searchQuery)).length;
}

/**
 * Deletes a specific clipboard entry file, and removes it from the cache.
 *
 * @param timestamp The timestamp of the clipboard entry (used as filename).
 * @returns A promise that resolves when deletion completes (or is skipped if not found).
 */
export async function deleteClipboardEntry(timestamp: number): Promise<void> {
    await initializeCache();
    const fname = `${timestamp}.json`;
    const filePath = path.join(HISTORY_DIR, fname);

    try {
        const raw = await fs.readFile(filePath, 'utf-8');
        const content = JSON.parse(raw) as ClipboardContent; 
        content.tags.forEach(tag => {
            const index = cachedTags.indexOf(tag);
            if (index !== -1) {
                cachedTags.splice(index, 1);
            }
        });
        await fs.unlink(filePath);
        await saveTagsToFile();
        cachedAllFilesOrdered = cachedAllFilesOrdered.filter(f => f !== fname);
    } catch {
        // File may not exist; ignore silently
    }
}

/**
 * Adds a new tag to a specific clipboard entry file 
 * @param timestamp The timestamp of the clipboard entry (used as filename)
 * @param tag The tag to be added in the file
 * @returns A promise that resolves when adding tag completes (or is skipped if not found)
 */
export async function addClipboardTag(timestamp: number, tag: string): Promise<void> {
    await initializeCache();
    const filePath = path.join(HISTORY_DIR, `${timestamp}.json`);
    try {
        const raw = await fs.readFile(filePath, 'utf-8');
        const content = JSON.parse(raw) as ClipboardContent;
        if (content.tags.indexOf(tag) === -1) {
            content.tags.push(tag);
            cachedTags.push(tag);
            await saveTagsToFile(); 
            await fs.writeFile(filePath, JSON.stringify(content));
        }
        
        
    } catch {
        // File may not exist; ignore silently
    }
    
}

/**
 * Removes the given tag of a specific clipboard entry file 
 * @param timestamp The timestamp of the clipboard entry (used as filename)
 * @param tag The tag to be removed in the file
 * @returns A promise that resolves when removing the tag completes (or is skipped if not found)
 */
export async function removeClipboardTag(timestamp: number, tag: string): Promise<void> {
    await initializeCache();
    const filePath = path.join(HISTORY_DIR, `${timestamp}.json`);
    try {
        const raw = await fs.readFile(filePath, 'utf-8');
        const content = JSON.parse(raw) as ClipboardContent;
        content.tags = content.tags.filter(t => t !== tag);
        const cachedIndex = cachedTags.indexOf(tag);
        if (cachedIndex !== -1) {
            cachedTags.splice(cachedIndex, 1); // removing one occurrance of the tag
        }
        await saveTagsToFile();
        await fs.writeFile(filePath, JSON.stringify(content));
        
    } catch {
        // File may not exist; ignore silently
    }

}

/**
 * The unique tags added by the user across all clipboard entries
 * @returns a list containing the unique tags as described
 */
export async function getAllTags(): Promise<string[]> {
    await initializeCache();
    return [...new Set(cachedTags)];
}


/**
 * Save tags to the tags.json file
 * @returns A promise that resolves when the tags are written
 */
export async function saveTagsToFile(): Promise<void> {
    try {
        // Ensure the directory exists
        await fs.mkdir(HISTORY_DIR, { recursive: true });
        
        const tagsArray = cachedTags.sort();
        await fs.writeFile(TAGS_FILE, JSON.stringify(tagsArray));
        
        console.log(`Tags saved to file: ${tagsArray.length} tags`);
    } catch (error) {
        console.error('Failed to save tags to file:', error);
    }
     
}