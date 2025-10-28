import css from "./HorizontalMeter.sass?inline"
import {AnimationFrame, Html} from "@dlm-daw/lib-dom"
import {Arrays, Lifecycle, ValueMapping} from "@dlm-daw/lib-std"
import {createElement} from "@dlm-daw/lib-jsx"
import {CanvasPainter} from "@/ui/canvas/painter"
import {Colors} from "@dlm-daw/studio-core"

const className = Html.adoptStyleSheet(css, "PeakVolumeSlider")

type Construct = {
    lifecycle: Lifecycle
    peaksInDb: Float32Array
    width?: string
}

type Peak = {
    time: number
    value: number
}

export const HorizontalPeakMeter = ({lifecycle, peaksInDb, width}: Construct) => {
    const canvas: HTMLCanvasElement = <canvas/>
    const mapping = ValueMapping.linear(-48, 9)
    const s0 = mapping.x(-12)
    const s1 = mapping.x(0)
    const maxPeaks: ReadonlyArray<Peak> = Arrays.create(() => ({
        time: 0,
        value: Number.NEGATIVE_INFINITY
    }), peaksInDb.length)
    const peakPainter = new CanvasPainter(canvas, painter => {
        const {context, actualWidth, actualHeight} = painter
        const now = Date.now()
        context.clearRect(0, 0, actualWidth, actualHeight)
        const gradient = context.createLinearGradient(0, 0, actualWidth, 0)
        gradient.addColorStop(s0, Colors.green)
        gradient.addColorStop(s0, Colors.yellow)
        gradient.addColorStop(s1, Colors.yellow)
        gradient.addColorStop(s1, Colors.red)
        context.fillStyle = gradient
        context.globalAlpha = 0.08
        peaksInDb.forEach((_peak, index) => {
            const h = Math.floor(actualHeight / peaksInDb.length)
            context.fillRect(0, index * (h + 1), actualWidth, h - 1)
        })
        context.globalAlpha = 1.0
        peaksInDb.forEach((peak, index) => {
            const h = Math.floor(actualHeight / peaksInDb.length)
            context.fillRect(0, index * (h + 1), actualWidth * mapping.x(peak), h - 1)
            const peakHold = maxPeaks[index]
            if (peakHold.value <= peak) {
                peakHold.value = peak
                peakHold.time = now
            } else if (now - peakHold.time >= 2000) {
                peakHold.value -= 0.75
            }
            const x = Math.ceil(actualWidth * mapping.x(peakHold.value))
            if (x > 0) {
                context.fillRect(x, index * (h + 1), 1, h - 1)
            }
        })
    })
    lifecycle.ownAll(
        peakPainter,
        AnimationFrame.add(peakPainter.requestUpdate)
    )
    return (<div className={className} style={{width}}>{canvas}</div>)
}