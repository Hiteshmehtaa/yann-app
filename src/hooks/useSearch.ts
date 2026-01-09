/**
 * Search Hook
 * 
 * Debounced search with filtering
 */

import { useState, useEffect, useCallback } from 'react';

interface UseSearchOptions {
    debounceMs?: number;
    minLength?: number;
}

export function useSearch<T>(
    items: T[],
    searchFields: (keyof T)[],
    options: UseSearchOptions = {}
) {
    const { debounceMs = 300, minLength = 2 } = options;

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [filteredItems, setFilteredItems] = useState<T[]>(items);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [searchQuery, debounceMs]);

    // Filter items based on search query
    useEffect(() => {
        if (!debouncedQuery || debouncedQuery.length < minLength) {
            setFilteredItems(items);
            return;
        }

        const query = debouncedQuery.toLowerCase();
        const filtered = items.filter(item => {
            return searchFields.some(field => {
                const value = item[field];
                if (typeof value === 'string') {
                    return value.toLowerCase().includes(query);
                }
                if (typeof value === 'number') {
                    return value.toString().includes(query);
                }
                return false;
            });
        });

        setFilteredItems(filtered);
    }, [debouncedQuery, items, searchFields, minLength]);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
        setDebouncedQuery('');
    }, []);

    return {
        searchQuery,
        setSearchQuery,
        filteredItems,
        clearSearch,
        isSearching: searchQuery.length >= minLength,
    };
}
