export default class EmptyPosition extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EmptyPosition';
    }
}