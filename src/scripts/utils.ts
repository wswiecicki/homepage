export function throttle<T extends any[]>(
    this: ThisParameterType<any>,
    callback: (this: ThisParameterType<any>, ...args: T) => void,
    limit: number
): (...args: T) => void {
    let waiting = false;
    return function (this: ThisParameterType<any>, ...args: T) {
        if (!waiting) {
            callback.apply(this, args);
            waiting = true;
            setTimeout(() => {
                waiting = false;
            }, limit);
        }
    };
}
