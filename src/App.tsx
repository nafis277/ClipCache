import { useEffect, useRef, useState } from 'react';
import './App.css';
import 'highlight.js/styles/github.css';
import { type ClipEntry, type ClipboardContent, ClipCard } from './ClipboardItem';

export default function App() {
    const [clipboardHistory, setClipboardHistory] = useState<ClipEntry[]>([]);
    const [page, setPage] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [showToast, setShowToast] = useState(false);

    const [inDefault, setInDefault] = useState(true);

    const batchSize = 5;

    const pageRef = useRef(page);
    const inDefaultRef = useRef(inDefault);
    const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        pageRef.current = page;
        inDefaultRef.current = inDefault;
    }, [inDefault, page]);

    
    const loadPage = async (pageIndex: number, searchQuery?: string) => {
        const startIndex = pageIndex * batchSize;
        const batch = await window.clipboardAPI.getBatch(startIndex, batchSize, searchQuery);
        const converted = batch.map(item => {
            return {
                ...item,
                viewMode: 'raw',
            } as ClipEntry;
        });
        setClipboardHistory(converted);
        setPage(pageIndex);
    };

    useEffect(() => {
        (async () => {
            const total = await window.clipboardAPI.getTotal();
            setTotalEntries(total);
            loadPage(0);
        })();
        window.clipboardAPI.onClipboardUpdate((newContent: ClipboardContent) => {
            if (pageRef.current !== 0 || !inDefaultRef.current) {
                return;
            }
            const entry: ClipEntry = {
                ...newContent,
                viewMode: 'raw',
            };
            setTotalEntries(prev => prev + 1);
            setClipboardHistory(prev => [entry, ...prev].slice(0, batchSize));
        });

        // Cleanup timeout on unmount
        return () => {
            if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current);
            }
        };
    }, []);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        
        // Show toast notification
        setShowToast(true);
        
        // Clear any existing timeout
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }
        
        // Hide toast after 2 seconds
        toastTimeoutRef.current = setTimeout(() => {
            setShowToast(false);
        }, 2000);
    };

    const handleDelete = (index: number) => {
        const deleted = clipboardHistory[index];
        const updated = clipboardHistory.filter((_, i) => i !== index);
        setClipboardHistory(updated);
        window.clipboardAPI.deleteClipboardEntry(deleted.timestamp); 
        setTotalEntries(prev => prev - 1);
        loadPage(page);
    };

    const toggleView = (index: number) => {
        setClipboardHistory(prev =>
            prev.map((item, i) =>
                i === index ? { ...item, viewMode: item.viewMode === 'raw' ? 'formatted' : 'raw' } : item
            )
        );
    };

    const handleSearch = async (query: string) => {
        console.log(query);
        setSearchText(query);
        setInDefault(query.length === 0);
        const total = await window.clipboardAPI.getTotal(query);
        setTotalEntries(total);
        loadPage(0, query);
    }

    return (
        <div className="app-container">
            <h1 className="app-title">📋 ClipCache</h1>
            <input
                type="text"
                placeholder="Search clipboard content..."
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                className="search-input"
            />
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
                <button disabled={page === 0} onClick={() => loadPage(page - 1, searchText)}>Prev</button>
                <span> Page {page + 1} </span>
                <button disabled={(page + 1) * batchSize >= totalEntries} onClick={() => loadPage(page + 1, searchText)}>Next</button>
            </div>

            {/* Toast Notification */}
            <div className={`toast ${showToast ? 'toast-show' : ''}`}>
                ✓ Copied to clipboard!
            </div>
        </div>
    );
}