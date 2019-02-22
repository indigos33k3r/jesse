export default interface NotificationsDriverInterface {
    send(message: string): Promise<void>; 
}