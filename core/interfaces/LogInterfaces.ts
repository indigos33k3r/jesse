export interface ReduxActionLogInterface {
    type: string; 
    createdAt: number; 
}

export interface ErrorInterface {
    time: number;
    message: string;
}

export interface WarningInterface {
    time: number;
    message: string;
}