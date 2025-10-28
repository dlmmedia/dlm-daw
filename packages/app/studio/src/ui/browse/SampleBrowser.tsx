import css from "./SampleBrowser.sass?inline"
import {clamp, DefaultObservableValue, Lifecycle, RuntimeSignal, StringComparator, Terminator} from "@dlm-daw/lib-std"
import {Await, createElement, Frag, Hotspot, HotspotUpdater, Inject, replaceChildren} from "@dlm-daw/lib-jsx"
import {Events, Html, Keyboard} from "@dlm-daw/lib-dom"
import {Runtime} from "@dlm-daw/lib-runtime"
import {IconSymbol} from "@dlm-daw/studio-adapters"
import {ProjectSignals, SampleStorage} from "@dlm-daw/studio-core"
import {StudioService} from "@/service/StudioService.ts"
import {ThreeDots} from "@/ui/spinner/ThreeDots.tsx"
import {Button} from "@/ui/components/Button.tsx"
import {SearchInput} from "@/ui/components/SearchInput"
import {SampleView} from "@/ui/browse/SampleView"
import {RadioGroup} from "../components/RadioGroup"
import {Icon} from "../components/Icon"
import {SampleLocation} from "@/ui/browse/SampleLocation"
import {HTMLSelection} from "@/ui/HTMLSelection"
import {SampleService} from "@/ui/browse/SampleService"

const className = Html.adoptStyleSheet(css, "Samples")

type Construct = {
    lifecycle: Lifecycle
    service: StudioService
}

const location = new DefaultObservableValue(SampleLocation.Cloud)

export const SampleBrowser = ({lifecycle, service}: Construct) => {
    lifecycle.own({terminate: () => service.samplePlayback.eject()})
    const entries: HTMLElement = <div className="scrollable"/>
    const selection = lifecycle.own(new HTMLSelection(entries))
    const sampleService = new SampleService(service, selection)
    const entriesLifeSpan = lifecycle.own(new Terminator())
    const reload = Inject.ref<HotspotUpdater>()
    lifecycle.own(location.subscribe(() => reload.get().update()))
    lifecycle.own(RuntimeSignal.subscribe(signal => signal === ProjectSignals.StorageUpdated && reload.get().update()))
    const filter = new DefaultObservableValue("")
    const searchInput = <SearchInput lifecycle={lifecycle} model={filter}/>
    const slider: HTMLInputElement = <input type="range" min="0.0" max="1.0" step="0.001"/>
    const linearVolume = service.samplePlayback.linearVolume
    const element: Element = (
        <div className={className} tabIndex={-1}>
            <div className="filter">
                <RadioGroup lifecycle={lifecycle} model={location} elements={[
                    {
                        value: SampleLocation.Cloud,
                        element: <Icon symbol={IconSymbol.CloudFolder}/>,
                        tooltip: "Online samples"
                    },
                    {
                        value: SampleLocation.Local,
                        element: <Icon symbol={IconSymbol.UserFolder}/>,
                        tooltip: "Locally stored samples"
                    }
                ]} appearance={{framed: true, landscape: true}}/>
                {searchInput}
            </div>
            <div className="content">
                <Hotspot ref={reload} render={() => {
                    service.samplePlayback.eject()
                    entriesLifeSpan.terminate()
                    return (
                        <Await factory={async () => {
                            switch (location.getValue()) {
                                case SampleLocation.Local:
                                    return SampleStorage.listSamples()
                                case SampleLocation.Cloud:
                                    return service.sampleAPI.all()
                            }
                        }} loading={() => {
                            return (
                                <div className="loading">
                                    <ThreeDots/>
                                </div>
                            )
                        }} failure={({reason, retry}) => (
                            <div className="error">
                                <span>{reason.message}</span>
                                <Button lifecycle={lifecycle} onClick={retry} appearance={{framed: true}}>RETRY</Button>
                            </div>
                        )} success={(result) => {
                            const update = () => {
                                entriesLifeSpan.terminate()
                                replaceChildren(entries, result
                                    .filter(({name}) => name.toLowerCase().includes(filter.getValue().toLowerCase()))
                                    .toSorted((a, b) => StringComparator(a.name.toLowerCase(), b.name.toLowerCase()))
                                    .map(sample => (
                                        <SampleView lifecycle={entriesLifeSpan}
                                                    sampleService={sampleService}
                                                    playback={service.samplePlayback}
                                                    sample={sample}
                                                    location={location.getValue()}
                                                    refresh={() => reload.get().update()}
                                        />
                                    )))
                            }
                            lifecycle.own(filter.catchupAndSubscribe(update))
                            lifecycle.own(service.subscribeSignal(() => {
                                Runtime.debounce(() => {
                                    location.setValue(SampleLocation.Local)
                                    reload.get().update()
                                }, 500)
                            }, "import-sample"))
                            return (
                                <Frag>
                                    <header>
                                        <span>Name</span>
                                        <span className="right">bpm</span>
                                        <span className="right">sec</span>
                                    </header>
                                    {entries}
                                </Frag>
                            )
                        }}/>
                    )
                }}>
                </Hotspot>
            </div>
            <div className="footer">
                <label>Volume</label> {slider}
            </div>
        </div>
    )
    lifecycle.ownAll(
        Events.subscribe(slider, "input",
            () => linearVolume.setValue(clamp(slider.valueAsNumber, 0.0, 1.0))),
        linearVolume.catchupAndSubscribe(owner => slider.valueAsNumber = owner.getValue()),
        Events.subscribe(element, "keydown", async event => {
            if (Keyboard.GlobalShortcut.isDelete(event) && location.getValue() === SampleLocation.Local) {
                await sampleService.deleteSelected()
                reload.get().update()
            }
        })
    )
    return element
}