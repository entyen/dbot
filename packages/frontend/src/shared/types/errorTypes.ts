export interface ErrorType {
    readonly message: string
    readonly response: {
        readonly status?: string
    }
}

export interface RejectedDataType {
    readonly messageError: string
    readonly status?: string
}
