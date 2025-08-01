/**
 * Represents a single clipboard entry.
 * 
 * @property text The plain text content of the clipboard.
 * @property html The HTML content of the clipboard (if available).
 * @property timestamp The time at which the content was copied, in milliseconds since epoch.
 */
export type ClipboardContent = {
    text: string,
    html: string,
    timestamp: number,
    tags: string[],
};

/**
 * Represents a query type.
 * @property text The text content to look for in the clipboard entry (empty means no filtering)
 * @property tag The tag of the clipboard entry (empty means no filtering)
 */
export type SearchQuery = {
    text: string,
    tag: string,
}