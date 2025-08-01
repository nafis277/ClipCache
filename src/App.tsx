import { useEffect, useRef, useState } from 'react';
import './App.css';
import 'highlight.js/styles/github.css';
import { ClipCard } from './ClipboardItem';
import { type ClipboardContent, type SearchQuery } from '../shared/types';

export default function App() {
    const [clipboardHistory, setClipboardHistory] = useState<ClipboardContent[]>([]);
    const [page, setPage] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [selectedTag, setSelectedTag] = useState('');
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [showToast, setShowToast] = useState(false);
    const [inDefault, setInDefault] = useState(true);

    const batchSize = 8;

    const pageRef = useRef(page);
    const inDefaultRef = useRef(inDefault);
    const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        pageRef.current = page;
        inDefaultRef.current = inDefault;
    }, [inDefault, page]);

    // Load available tags
    const loadAvailableTags = async () => {
        try {
            // Assuming you have an API method to get all unique tags
            const tags = await window.clipboardAPI.getAllTags();
            console.log("Received: ", tags);
            setAvailableTags(tags);
        } catch (error) {
            console.error('Failed to load tags:', error);
        }
    };

    const loadPage = async (pageIndex: number, searchQuery?: SearchQuery) => {
        const startIndex = pageIndex * batchSize;
        const batch = await window.clipboardAPI.getBatch(startIndex, batchSize, searchQuery);
        setClipboardHistory(batch);
        setPage(pageIndex);
    };

    useEffect(() => {
        (async () => {
            const total = await window.clipboardAPI.getTotal();
            setTotalEntries(total);
            await loadAvailableTags();
            loadPage(0);
        })();
        window.clipboardAPI.onClipboardUpdate((newContent: ClipboardContent) => {
            if (pageRef.current !== 0 || !inDefaultRef.current) {
                return;
            }
            setTotalEntries(prev => prev + 1);
            setClipboardHistory(prev => [newContent, ...prev].slice(0, batchSize));
            // Refresh available tags when new content is added
            loadAvailableTags();
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

    const handleDelete = async (index: number) => {
        const deleted = clipboardHistory[index];
        const updated = clipboardHistory.filter((_, i) => i !== index);
        setClipboardHistory(updated);
        await window.clipboardAPI.deleteClipboardEntry(deleted.timestamp); 
        setTotalEntries(prev => prev - 1);
        await loadAvailableTags();
    };

    const handleSearch = async (query: string) => {
        setSearchText(query);
        setInDefault(query.length === 0 && selectedTag.length === 0);
        const searchQuery = {
            text: query,
            tag: selectedTag,
        };
        const total = await window.clipboardAPI.getTotal(searchQuery);
        setTotalEntries(total);
        await loadPage(0, searchQuery);
    };

    const handleTagFilter = async (tag: string) => {
        setSelectedTag(tag);
        setInDefault(searchText.length === 0 && tag.length === 0);
        const searchQuery = {
            text: searchText,
            tag: tag,
        };
        const total = await window.clipboardAPI.getTotal(searchQuery);
        setTotalEntries(total);
        await loadPage(0, searchQuery);
    };

    const handleAddTag = async (index: number, tag: string) => {
        const newHistory = [...clipboardHistory];
        newHistory[index] = {
            ...newHistory[index],
            tags: [...newHistory[index].tags, tag]
        };
        setClipboardHistory(newHistory);

        await window.clipboardAPI.addClipboardTag(newHistory[index].timestamp, tag);
        // Refresh available tags
        await loadAvailableTags();
    };

    const handleRemoveTag = async (index: number, tag: string) => {
        const newTags = clipboardHistory[index].tags.filter(t => t !== tag);
        const newHistory = [...clipboardHistory];
        newHistory[index] = {
            ...newHistory[index],
            tags: newTags
        };
        setClipboardHistory(newHistory);
        await window.clipboardAPI.removeClipboardTag(newHistory[index].timestamp, tag);
        // Refresh available tags
        await loadAvailableTags();
    };

    const handleNext = () => {
        const searchQuery = {
            text: searchText,
            tag: selectedTag,
        };
        loadPage(page + 1, searchQuery);
    };

    const handlePrev = () => {
        const searchQuery = {
            text: searchText,
            tag: selectedTag,
        };
        loadPage(page - 1, searchQuery);

    }
    const clearFilters = async () => {
        setSearchText('');
        setSelectedTag('');
        setInDefault(true);
        const total = await window.clipboardAPI.getTotal();
        setTotalEntries(total);
        await loadPage(0);
    };

    return (
        <div className="app-container">
            <h1 className="app-title">📋 ClipCache</h1>
            
            <div className="filter-controls">
                <input
                    type="text"
                    placeholder="Search clipboard content..."
                    value={searchText}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="search-input"
                />
                
                <div className="tag-filter-container">
                    <select 
                        value={selectedTag} 
                        onChange={(e) => handleTagFilter(e.target.value)}
                        className="tag-filter-dropdown"
                    >
                        <option value="">All Tags</option>
                        {availableTags.map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
                        ))}
                    </select>
                </div>

                {(searchText || selectedTag) && (
                    <button onClick={clearFilters} className="clear-filters-btn">
                        Clear Filters
                    </button>
                )}
            </div>

            {clipboardHistory.length === 0 ? (
                <p className="no-items">
                    {searchText || selectedTag ? 'No items match your filters.' : 'Copy something to get started!'}
                </p>
            ) : (
                clipboardHistory.map((entry, idx) => (
                    <ClipCard
                        key={idx}
                        index={idx}
                        entry={entry}
                        handleCopy={handleCopy}
                        handleDelete={handleDelete}
                        handleAddTag={handleAddTag}
                        handleRemoveTag={handleRemoveTag}
                    />
                ))
            )}
            <div className="page-controls">
                <button disabled={page === 0} onClick={handlePrev}>Prev</button>
                <span> Page {page + 1} </span>
                <button disabled={(page + 1) * batchSize >= totalEntries} onClick={handleNext}>Next</button>
            </div>

            {/* Toast Notification */}
            <div className={`toast ${showToast ? 'toast-show' : ''}`}>
                ✓ Copied to clipboard!
            </div>
        </div>
    );
}