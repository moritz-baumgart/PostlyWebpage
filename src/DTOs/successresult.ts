export class SuccessResult<T, E> {
    success: boolean = false
    result?: T
    error?: E
}