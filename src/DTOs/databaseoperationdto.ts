export interface DatabaseOperationDTO {
    hasResult: boolean;
    affectedRows: number | null;
    columns: string[] | null;
    result: string[][] | null;
}