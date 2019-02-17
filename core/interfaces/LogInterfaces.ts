export interface ReduxActionLogInterface {
    type: string; 
    createdAt: string; 
}

export interface ErrorInterface {
    time: string;
    message: string;
}

export interface WarningInterface {
    time: string;
    message: string;
}