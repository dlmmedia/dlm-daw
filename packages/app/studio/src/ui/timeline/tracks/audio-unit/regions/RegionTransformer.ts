import {
    AnyClipBox,
    AnyRegionBoxAdapter,
    AudioRegionBoxAdapter,
    NoteRegionBoxAdapter,
    ValueRegionBoxAdapter
} from "@dlm-daw/studio-adapters"
import {AudioClipBox, NoteClipBox, ValueClipBox} from "@dlm-daw/studio-boxes"
import {asDefined, UUID} from "@dlm-daw/lib-std"

export namespace RegionTransformer {
    export const toClip = (region: AnyRegionBoxAdapter, copyEvents: boolean = true): AnyClipBox => {
        const trackBoxAdapter = region.trackBoxAdapter.unwrap()
        const index = trackBoxAdapter.clips.collection.getMinFreeIndex()
        const target = trackBoxAdapter.box.clips
        return asDefined(region.accept<AnyClipBox>({
            visitNoteRegionBoxAdapter: (source: NoteRegionBoxAdapter) => {
                const events = copyEvents ? source.optCollection.unwrap().copy().box.owners : source.box.events.targetVertex.unwrap()
                return NoteClipBox.create(trackBoxAdapter.box.graph, UUID.generate(), box => {
                    box.index.setValue(index)
                    box.label.setValue(source.label)
                    box.hue.setValue(source.hue)
                    box.mute.setValue(source.mute)
                    box.duration.setValue(source.loopDuration)
                    box.events.refer(events)
                    box.clips.refer(target)
                })
            },
            visitAudioRegionBoxAdapter: (source: AudioRegionBoxAdapter) =>
                AudioClipBox.create(trackBoxAdapter.box.graph, UUID.generate(), box => {
                    box.index.setValue(index)
                    box.label.setValue(source.label)
                    box.hue.setValue(source.hue)
                    box.mute.setValue(source.mute)
                    box.gain.setValue(source.gain)
                    box.duration.setValue(source.loopDuration)
                    box.file.refer(source.box.file.targetVertex.unwrap())
                    box.clips.refer(target)
                }),
            visitValueRegionBoxAdapter: (source: ValueRegionBoxAdapter) => {
                const events = copyEvents ? source.optCollection.unwrap().copy().box.owners : source.box.events.targetVertex.unwrap()
                return ValueClipBox.create(trackBoxAdapter.box.graph, UUID.generate(), box => {
                    box.index.setValue(index)
                    box.label.setValue(source.label)
                    box.hue.setValue(source.hue)
                    box.mute.setValue(source.mute)
                    box.duration.setValue(source.loopDuration)
                    box.events.refer(events)
                    box.clips.refer(target)
                })
            }
        }), `Could not convert ${region} to clip`)
    }
}