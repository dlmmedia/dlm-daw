import {clamp, int, Notifier, Observable, Observer, Subscription} from "@dlm-daw/lib-std"
import {ppqn, PPQN} from "@dlm-daw/lib-dsp"

import {MenuItem, MenuRootData} from "@/ui/model/menu-item"
import {TimelineRange} from "@dlm-daw/studio-core"

export interface SnapUnit {
    get name(): string
    get ppqn(): int
}

const SMART_MIN_PIXEL = 16 as const

export class Snapping implements Observable<Snapping> {
    static readonly createMenuRoot = (snapping: Snapping): MenuItem<MenuRootData> => MenuItem.root()
        .setRuntimeChildrenProcedure(parent => parent.addMenuItem(...snapping.units
            .map((unit: SnapUnit, index: int) => MenuItem.default({label: unit.name, checked: unit === snapping.unit})
                .setTriggerProcedure(() => snapping.index = index))))

    readonly #range: TimelineRange
    readonly #units: ReadonlyArray<SnapUnit>
    readonly #notifier: Notifier<Snapping>

    #enabled: boolean = true
    #index: int = 0 | 0

    constructor(range: TimelineRange) {
        this.#range = range
        this.#units = this.#initUnits()
        this.#notifier = new Notifier<Snapping>()
    }

    subscribe(observer: Observer<Snapping>): Subscription {return this.#notifier.subscribe(observer)}
    catchupAndSubscribe(observer: Observer<Snapping>): Subscription {
        observer(this)
        return this.#notifier.subscribe(observer)
    }

    terminate(): void {this.#notifier.terminate()}

    get unit(): SnapUnit {return this.#units[this.#index]}
    get enabled(): boolean {return this.#enabled}
    get index(): int {return this.#index}
    set index(value: int) {
        if (this.#index === value) {return}
        this.#index = value
        this.#notifier.notify(this)
    }
    get units(): ReadonlyArray<SnapUnit> {return this.#units}
    get value(): ppqn {return this.#enabled ? this.#units[this.#index].ppqn : 1}

    xToUnitFloor(x: number): ppqn {return this.floor(this.#range.xToUnit(x))}
    xToUnitCeil(x: number): ppqn {return this.ceil(this.#range.xToUnit(x))}
    xToUnitRound(x: number): ppqn {return this.round(this.#range.xToUnit(x))}

    floor(value: ppqn): ppqn {
        const units = this.value
        return Math.floor(value / units) * units
    }

    round(value: ppqn): ppqn {
        const units = this.value
        return Math.round(value / units) * units
    }

    ceil(value: ppqn): ppqn {
        const units = this.value
        return Math.ceil(value / units) * units
    }

    computeDelta(beingPointerPulse: ppqn, newPointerX: number, beginValuePulse: ppqn): ppqn {
        const pointerTicks = this.#range.xToUnit(newPointerX) - (beingPointerPulse - beginValuePulse)
        const localDelta = this.round(pointerTicks - beginValuePulse)
        const globalDelta = this.round(pointerTicks) - beginValuePulse
        const localDistance = Math.abs((beginValuePulse + localDelta) - pointerTicks)
        const globalDistance = Math.abs((beginValuePulse + globalDelta) - pointerTicks)
        return localDistance < globalDistance ? localDelta : globalDelta
    }

    #initUnits() {
        const range: TimelineRange = this.#range
        return [
            {
                name: "Smart",
                get ppqn(): int {
                    const minUnits = SMART_MIN_PIXEL * range.unitsPerPixel
                    const stepExp = Math.ceil((Math.log(minUnits / PPQN.Bar) / Math.log(2.0)))
                    const clampSmartSnapping = true
                    let min
                    if (clampSmartSnapping) {
                        min = PPQN.fromSignature(1, 16)
                    } else {
                        min = PPQN.fromSignature(1, 128)
                    }
                    return clamp(Math.floor(PPQN.Bar * Math.pow(2.0, stepExp) + 0.5), min, PPQN.Bar)
                }
            },
            {name: "Bar", ppqn: PPQN.fromSignature(1, 1)},
            {name: "1/2", ppqn: PPQN.fromSignature(1, 2)},
            {name: "1/4", ppqn: PPQN.fromSignature(1, 4)},
            {name: "1/8", ppqn: PPQN.fromSignature(1, 8)},
            {name: "1/8T", ppqn: PPQN.fromSignature(1, 4) / 3},
            {name: "1/16", ppqn: PPQN.fromSignature(1, 16)},
            {name: "1/16T", ppqn: PPQN.fromSignature(1, 8) / 3},
            {name: "1/32", ppqn: PPQN.fromSignature(1, 32)},
            {name: "1/32T", ppqn: PPQN.fromSignature(1, 16) / 3},
            {name: "1/64", ppqn: PPQN.fromSignature(1, 64)},
            {name: "1/128", ppqn: PPQN.fromSignature(1, 128)},
            {name: "Off", ppqn: 1}
        ]
    }
}