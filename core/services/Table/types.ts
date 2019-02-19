export interface TableDataInterface {
    key: string;
    value: any;
    color?: string;
}

export interface MultiValueTableDataInterface {
    item: TableDataInterface[]; 
}