import {Func, TimeSpan, unitValue} from "@dlm-daw/lib-std"

export namespace TimeSpanUtils {
    export const startEstimator = (): Func<number, TimeSpan> => {
        const startTime: number = performance.now()
        return (progress: unitValue): TimeSpan => {
            if (progress === 0.0) {return TimeSpan.POSITIVE_INFINITY}
            const runtime = (performance.now() - startTime)
            return TimeSpan.millis(runtime / progress - runtime)
        }
    }
}