import type { JSX } from "react";
import hljs from 'highlight.js';
import { useState } from "react";
import { type ClipboardContent } from "../shared/types";
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
    return {
        highlighted: result.value,
        language: result.language ?? 'plaintext'
    };
}

function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
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
    handleCopy,
    handleDelete,
    handleAddTag,
    handleRemoveTag,
}: {
    entry: ClipboardContent;
    index: number;
    handleCopy: (text: string) => void;
    handleDelete: (index: number) => void;
    handleAddTag: (index: number, tag: string) => void;
    handleRemoveTag: (index: number, tag: string) => void;
}): JSX.Element {
    const { highlighted, language } = processHighlight(entry.text);
    const timestamp = formatTime(entry.timestamp);

    const [newTagInput, setNewTagInput] = useState('');
    const [showInput, setShowInput] = useState(false);

    const onTagSubmit = () => {
        const trimmed = newTagInput.trim();
        if (trimmed && !entry.tags.includes(trimmed)) {
            handleAddTag(index, trimmed);
        }
        setNewTagInput('');
        setShowInput(false);
    };

    return (
        <div className="clip-item">
            <div className="clip-meta">
                <span className="timestamp">{timestamp}</span>
            </div>

            <div className="clip-content">
                <div className="item-header">
                    <span className="lang-label">{language}</span>
                    <button className="copy-btn" onClick={() => handleCopy(entry.text)}>
                        Copy
                    </button>
                </div>

                <div className="scrollable-content">
                    {language === 'plaintext' ? (
                        <pre>
                            <code className="language-plaintext">
                                {entry.text}
                            </code>
                        </pre>
                    ) : (
                        <pre>
                            <code
                                className="hljs"
                                dangerouslySetInnerHTML={{ __html: highlighted }}
                            />
                        </pre>
                    )}
                </div>
            </div>

            <div className="clip-footer">
                <div className="tag-section">
                    <button className="add-tag-btn" onClick={() => setShowInput(true)}>
                        + Add tag
                    </button>

                    {showInput && (
                        <input
                            type="text"
                            className="tag-input"
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    onTagSubmit();
                                }
                            }}
                            onBlur={() => setShowInput(false)}
                            autoFocus
                        />
                    )}

                    {entry.tags.map((tag, i) => (
                        <span
                            key={`${tag}-${i}`}
                            className="tag"
                            onDoubleClick={() => handleRemoveTag(index, tag)}
                            title="Double-click to delete"
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                <button className="delete-btn" onClick={() => handleDelete(index)}>
                    Delete
                </button>
            </div>
        </div>
    );
}
