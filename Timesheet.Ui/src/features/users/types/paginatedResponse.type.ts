export interface PaginatedResponse<T> {
    totalRecords: number;
    page: number;
    pageSize: number;
    totalPages: number;
    data: T[];
}