import type { JSX } from "react";
import hljs from 'highlight.js';

export type ClipboardContent = {
    text: string;
    html: string;
    timestamp: number,
};
export type ClipEntry = ClipboardContent & {
    viewMode: 'raw' | 'formatted',
};

function processHighlight(text: string) {

    const languages = [
       'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp',
       'php', 'ruby', 'go', 'swift', 'kotlin', 'scala',
       'html', 'xml', 'css', 'scss', 'less', 'sass',
       'json', 'yaml', 'toml', 'ini', 'latex',
       'bash', 'shell', 'powershell', 'batch',
       'dockerfile', 'nginx', 'apache',
       'r', 'matlab', 'julia',
       'dart', 'lua', 'perl',
       'markdown', 'plaintext'
   ];
    
    const result = hljs.highlightAuto(text, languages);
    const isLikelyCode = result.relevance > 30;
    return {
        highlighted: result.value,
        language: result.language ?? 'plaintext',
        isCode: isLikelyCode,
    };
}

/**
 * Determines if HTML content contains meaningful formatting beyond plain text.
 * Compares the HTML content with its text-only version to detect if there are
 * structural differences that justify showing a formatted view.
 * 
 * @param html The HTML content to analyze
 * @param text The plain text version for comparison
 * @returns True if HTML contains meaningful formatting, false otherwise
 */
function containsMeaningfulFormatting(html: string, text: string) : boolean {
    const normalizedHtml = html.replace(/<[^>]+>/g, '').trim();
    const normalizedText = text.trim();
    if (!html || html.trim() === '') return false;
    return normalizedHtml !== normalizedText;
}

/**
 * Formats a timestamp into a human-readable date and time string.
 * Uses the user's locale settings for appropriate formatting.
 * 
 * @param timestamp Unix timestamp in milliseconds
 * @returns Formatted date string 
 */
function formatTime(timestamp: number) : string {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}


/**
 * ClipCard component renders a single clipboard entry with syntax highlighting,
 * view mode toggling, and action buttons for copying and deleting.
 * 
 * The component automatically detects if content is code and applies appropriate
 * syntax highlighting. It also supports toggling between raw text view and
 * formatted HTML view when meaningful HTML formatting is present.
 * 
 * @param entry The clipboard entry data containing text, html, timestamp, and viewMode
 * @param index The index of this entry in the list (used for callbacks)
 * @param toggleView Callback to toggle between raw and formatted view modes
 * @param handleCopy Callback to copy text to clipboard
 * @param handleDelete Callback to delete this clipboard entry
 * @returns {JSX.Element} Rendered clipboard card component
 */
export function ClipCard({
    entry,
    index,
    toggleView,
    handleCopy,
    handleDelete,
}: {
    entry: ClipEntry;
    index: number;
    toggleView: (i: number) => void;
    handleCopy: (text: string) => void;
    handleDelete: (index: number) => void;
}) : JSX.Element {
    const { highlighted, language, isCode } = processHighlight(entry.text);
    const canShowFormatted = containsMeaningfulFormatting(entry.html, entry.text);
    const timestamp = formatTime(entry.timestamp);

    return (
        <div className="clip-item">
            <div className="clip-meta">
                <span className="timestamp">{timestamp}</span>
                {canShowFormatted && (
                    <button className="toggle-btn" onClick={() => toggleView(index)}>
                        {entry.viewMode === 'raw' ? 'Show HTML view' : 'Show raw'}
                    </button>
                )}
            </div>

            <div className={`clip-content ${entry.viewMode}`}>
                {entry.viewMode === 'raw' ? (
                    <div className="raw-content">
                        {isCode ? (
                            <div className="code-block">
                                <div className="item-header">
                                    <span className="lang-label">{language}</span>
                                    <button className="copy-btn" onClick={() => handleCopy(entry.text)}>
                                        Copy
                                    </button>
                                </div>
                                <div className="scrollable-content">
                                    <pre>
                                        <code
                                            className="hljs"
                                            dangerouslySetInnerHTML={{ __html: highlighted }}
                                        />
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="plain-text">
                                <div className="item-header">
                                    <span className="lang-label">plaintext</span>
                                    <button className="copy-btn" onClick={() => handleCopy(entry.text)}>
                                        Copy
                                    </button>
                                </div>
                                <div className="scrollable-content">
                                    <pre>
                                        <code className="language-plaintext">
                                            {entry.text}
                                        </code>
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="formatted-content">
                        <div className="item-header">
                            <span className="lang-label">HTML Formatted</span>
                            <button className="copy-btn" onClick={() => handleCopy(entry.text)}>
                                Copy
                            </button>
                        </div>
                        <div className="scrollable-content">
                            <div dangerouslySetInnerHTML={{ __html: entry.html }} />
                        </div>
                    </div>
                )}
            </div>
            <div className="clip-footer">
                <button className="delete-btn" onClick={() => handleDelete(index)}>
                    Delete
                </button>
            </div>
        </div>
    );
}