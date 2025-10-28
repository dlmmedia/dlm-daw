import css from "./PeakMeter.sass?inline"
import {Arrays, int, Lifecycle, Terminator, ValueMapping} from "@dlm-daw/lib-std"
import {createElement} from "@dlm-daw/lib-jsx"
import {AnimationFrame, Html} from "@dlm-daw/lib-dom"
import {Colors} from "@dlm-daw/studio-core"

const className = Html.adoptStyleSheet(css, "peak-meter")

type Construct = {
    lifecycle: Lifecycle
    peaks: Float32Array
    channelWidthInEm?: number
    channelOffsetInEm?: number
}

export const PeakMeter = ({lifecycle, peaks, channelWidthInEm, channelOffsetInEm}: Construct) => {
    const element: HTMLDivElement = <div className={className} data-class="peak-meter"/>
    const channelWidth = channelWidthInEm ?? 0.3
    const channelOffset = channelOffsetInEm ?? 0.125
    const numChannels = peaks.length
    const gradientID = Html.nextID()
    const animation = lifecycle.own(new Terminator())
    lifecycle.own(Html.watchResize(element, () => {
        if (!element.isConnected) {return}
        Html.empty(element)
        const computedStyle = getComputedStyle(element)
        const emInPixels = parseFloat(computedStyle.fontSize)
        const channelWidthPX = channelWidth * emInPixels
        const channelOffsetPX = channelOffset * emInPixels
        const paddingInPX = emInPixels * 0.125
        const mapping = ValueMapping.linear(-60, 6)
        const s0 = `${mapping.x(-18)}`
        const s1 = `${mapping.x(0)}`
        const barsWidth = numChannels * channelWidthPX + (numChannels - 1) * channelOffsetPX
        const width = barsWidth + paddingInPX + emInPixels
        const height = element.clientHeight
        const trackHeight = height - paddingInPX * 2
        const bars: Array<SVGRectElement> = Arrays.create(channelIndex => {
            const x = (channelWidthPX + channelOffsetPX) * channelIndex + paddingInPX
            return <rect classList="bar"
                         x={x}
                         y={paddingInPX}
                         width={channelWidthPX}
                         height={0}
                         rx="1"
                         ry="1"
                         fill={`url(#${gradientID})`}/>
        }, numChannels)
        const strokes: SVGGraphicsElement = (
            <g stroke={Colors.dark} stroke-width={1} fill="none"/>
        )
        const labels: SVGGraphicsElement = (
            <g stroke="none" fill={Colors.dark} style={{fontSize: "0.4375em"}}/>
        )
        for (let db = -54; db <= 0; db += 6) {
            const y = paddingInPX + trackHeight * (1.0 - mapping.x(db))
            strokes.append(<line x1="1" x2="2" y1={y} y2={y}></line>)
            labels.append(<text x="3" y={`${y + 0.5}`} alignment-baseline="middle">{`${Math.abs(db)}`}</text>)
        }
        labels.append(<text x="3" y={`${trackHeight}`} alignment-baseline="middle">db</text>)
        element.appendChild(
            <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
                <defs>
                    <linearGradient id={gradientID}
                                    x1="0" x2="0"
                                    y2={paddingInPX} y1={trackHeight}
                                    gradientUnits="userSpaceOnUse">
                        <stop offset={s0} stop-color={Colors.green}/>
                        <stop offset={s0} stop-color={Colors.yellow}/>
                        <stop offset={s1} stop-color={Colors.yellow}/>
                        <stop offset={s1} stop-color={Colors.red}/>
                    </linearGradient>
                </defs>
                <rect
                    classList="background"
                    width={barsWidth + paddingInPX * 2}
                    height={height}
                    rx={paddingInPX}
                    ry={paddingInPX}/>
                {bars}
                {<g transform={`translate(${barsWidth + paddingInPX + emInPixels * 0.125}, 0)`}>
                    {strokes}
                    {labels}
                </g>}
            </svg>
        )
        animation.terminate()
        animation.own(AnimationFrame.add(() => peaks.forEach((db: number, index: int) => {
            const bar = bars[index]
            const ratio = db === Number.NEGATIVE_INFINITY ? 0.0 : mapping.x(db)
            const barHeight = Math.ceil(trackHeight * ratio)
            bar.y.baseVal.value = paddingInPX + (trackHeight - barHeight)
            bar.height.baseVal.value = barHeight
        })))
    }))
    return element
}