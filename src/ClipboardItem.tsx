import type { JSX } from "react";
import hljs from 'highlight.js';
export type ClipboardContent = {
    text: string;
    html: string;
};
export type ClipEntry = ClipboardContent & {
    viewMode: 'raw' | 'formatted',
    copiedAt: string,
};

function processHighlight(text: string) {
    const result = hljs.highlightAuto(text);
    const isLikelyCode = result.relevance > 5;
    return {
        highlighted: result.value,
        language: result.language ?? 'plaintext',
        isCode: isLikelyCode,
    };
}

function containsMeaningfulFormatting(html: string, text: string) : boolean {
    const normalizedHtml = html.replace(/<[^>]+>/g, '').trim();
    const normalizedText = text.trim();
    if (!html || html.trim() === '') return false;
    return normalizedHtml !== normalizedText;
}

function formatTime(isoString: string) : string {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}



export function ClipCard({
    entry,
    index,
    toggleView,
    handleCopy,
}: {
    entry: ClipEntry;
    index: number;
    toggleView: (i: number) => void;
    handleCopy: (text: string) => void;
}) : JSX.Element {
    const { highlighted, language, isCode } = processHighlight(entry.text);
    const canShowFormatted = containsMeaningfulFormatting(entry.html, entry.text);
    const timestamp = formatTime(entry.copiedAt);

    return (
        <div className="clip-item">
            <div className="clip-meta">
                <span className="timestamp">{timestamp}</span>
                {canShowFormatted && (
                    <button className="toggle-btn" onClick={() => toggleView(index)}>
                        {entry.viewMode === 'raw' ? 'Show formatted' : 'Show raw'}
                    </button>
                )}
            </div>

            <div className={`clip-content ${entry.viewMode}`}>
                {entry.viewMode === 'raw' ? (
                    <div className="raw-content">
                        {isCode ? (
                            <div className="code-block">
                                <div className="code-header">
                                    <span className="lang-label">{language}</span>
                                    <button className="copy-btn" onClick={() => handleCopy(entry.text)}>
                                        Copy
                                    </button>
                                </div>
                                <pre>
                                    <code
                                        className="hljs"
                                        dangerouslySetInnerHTML={{ __html: highlighted }}
                                    />
                                </pre>
                            </div>
                        ) : (
                            <div className="plain-text">
                                <div className="plain-header">
                                    <button className="copy-btn" onClick={() => handleCopy(entry.text)}>
                                        Copy
                                    </button>
                                </div>
                                {entry.text}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="formatted-content">
                        <div className="plain-header">
                            <button className="copy-btn" onClick={() => handleCopy(entry.text)}>
                                Copy
                            </button>
                        </div>
                        <div dangerouslySetInnerHTML={{ __html: entry.html }} />
                    </div>
                )}
            </div>
        </div>
    );
}