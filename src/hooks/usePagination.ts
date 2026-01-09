/**
 * Pagination Hook
 */

import { useState, useCallback } from 'react';

interface UsePaginationOptions {
    initialPage?: number;
    pageSize?: number;
}

export function usePagination<T>(
    fetchFunction: (page: number, limit: number) => Promise<{ data: T[]; meta: any }>,
    options: UsePaginationOptions = {}
) {
    const { initialPage = 1, pageSize = 20 } = options;

    const [page, setPage] = useState(initialPage);
    const [data, setData] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadData = useCallback(async (pageNum: number, append: boolean = false) => {
        try {
            if (append) {
                setIsLoadingMore(true);
            } else {
                setIsLoading(true);
            }
            setError(null);

            const response = await fetchFunction(pageNum, pageSize);

            if (append) {
                setData(prev => [...prev, ...response.data]);
            } else {
                setData(response.data);
            }

            setHasMore(response.meta?.hasNextPage ?? false);
            setPage(pageNum);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [fetchFunction, pageSize]);

    const loadMore = useCallback(() => {
        if (!isLoadingMore && hasMore) {
            loadData(page + 1, true);
        }
    }, [page, hasMore, isLoadingMore, loadData]);

    const refresh = useCallback(() => {
        setPage(initialPage);
        loadData(initialPage, false);
    }, [initialPage, loadData]);

    return {
        data,
        isLoading,
        isLoadingMore,
        hasMore,
        error,
        loadMore,
        refresh,
        page,
    };
}
