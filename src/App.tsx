import { useEffect, useState } from 'react';
import './App.css';
import 'highlight.js/styles/github.css';
import { type ClipEntry, type ClipboardContent, ClipCard } from './ClipboardItem';

export default function App() {
    const [clipboardHistory, setClipboardHistory] = useState<ClipEntry[]>([]);

    useEffect(() => {
        window.clipboardAPI.onClipboardUpdate((newContent: ClipboardContent) => {
            const entry: ClipEntry = {
                ...newContent,
                viewMode: 'raw',
                copiedAt: new Date().toISOString(),
            };
            setClipboardHistory(prev => [entry, ...prev]);
        });
    }, []);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const toggleView = (index: number) => {
        setClipboardHistory(prev =>
            prev.map((item, i) =>
                i === index ? { ...item, viewMode: item.viewMode === 'raw' ? 'formatted' : 'raw' } : item
            )
        );
    };

    return (
        <div className="app-container">
            <h1 className="app-title">📋 ClipCache</h1>
            {clipboardHistory.length === 0 ? (
                <p className="no-items">Copy something to get started!</p>
            ) : (
                clipboardHistory.map((entry, idx) => (
                    <ClipCard
                        key={idx}
                        index={idx}
                        entry={entry}
                        toggleView={toggleView}
                        handleCopy={handleCopy}
                    />
                ))
            )}
        </div>
    );
}

