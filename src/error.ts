
export class FatalError extends Error {
    public static NAME = 'FatalError';
    constructor(public message: string, public innerError?: Error) {
        super(message);
        this.name = FatalError.NAME;
        this.stack = new Error().stack;
    }
}