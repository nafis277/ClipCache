import { useEffect, useRef, useState } from 'react';
import './App.css';
import 'highlight.js/styles/github.css';
import { type ClipEntry, type ClipboardContent, ClipCard } from './ClipboardItem';

export default function App() {
    const [clipboardHistory, setClipboardHistory] = useState<ClipEntry[]>([]);
    const [page, setPage] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);
    const batchSize = 5;

    const pageRef = useRef(page);
    useEffect(() => {
        pageRef.current = page;
    }, [page]);

    
    const loadPage = async (pageIndex: number) => {
        const startIndex = pageIndex * batchSize;
        const batch = await window.clipboardAPI.getBatch(startIndex, batchSize);
        const converted = batch.map(item => {
            return {
                ...item, 
                viewMode: 'raw'
            };
        });
        setClipboardHistory(converted);
        setPage(pageIndex);
    };

    useEffect(() => {
        (async () => {
            const total = await window.clipboardAPI.getTotal();
            setTotalEntries(total);
            console.log("GOT TOTAL = ", total);
            loadPage(0);
        })();
        window.clipboardAPI.onClipboardUpdate((newContent: ClipboardContent) => {
            if (pageRef.current !== 0) {
                return;
            }
            const entry: ClipEntry = {
                ...newContent,
                viewMode: 'raw',
            };
            setTotalEntries(prev => prev + 1);
            setClipboardHistory(prev => [entry, ...prev].slice(0, batchSize));
        });
    }, []);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const handleDelete = (index: number) => {
        const deleted = clipboardHistory[index];
        const updated = clipboardHistory.filter((_, i) => i !== index);
        setClipboardHistory(updated);
        window.clipboardAPI.deleteClipboardEntry(deleted.timestamp); 
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
                        handleDelete={handleDelete}
                    />
                ))
            )}
            <div className="page-controls">
                <button disabled={page === 0} onClick={() => loadPage(page - 1)}>Prev</button>
                <span> Page {page + 1} </span>
                <button disabled={(page + 1) * batchSize >= totalEntries} onClick={() => loadPage(page + 1)}>Next</button>
            </div>
        </div>
    );
}

