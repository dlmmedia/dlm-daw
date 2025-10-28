import {AnyClipBoxAdapter} from "@dlm-daw/studio-adapters"
import {ElementCapturing} from "@/ui/canvas/capturing.ts"
import {BinarySearch, int, Nullable, NumberComparator} from "@dlm-daw/lib-std"
import {TracksManager} from "@/ui/timeline/tracks/audio-unit/TracksManager.ts"
import {ClipWidth} from "@/ui/timeline/tracks/audio-unit/clips/constants.ts"
import {TrackContext} from "@/ui/timeline/tracks/audio-unit/TrackContext.ts"
import {ExtraSpace} from "@/ui/timeline/tracks/audio-unit/Constants"

export type ClipCaptureTarget =
    | { type: "clip", clip: AnyClipBoxAdapter }
    | { type: "track", track: TrackContext, clipIndex: int }

export namespace ClipCapturing {
    export const create = (element: Element, manager: TracksManager) =>
        new ElementCapturing<ClipCaptureTarget>(element, {
            capture: (x: number, y: number): Nullable<ClipCaptureTarget> => {
                y += manager.scrollableContainer.scrollTop
                if (y > manager.scrollableContainer.scrollHeight - ExtraSpace) {return null}
                const tracks = manager.tracks()
                const trackIndex = BinarySearch
                    .rightMostMapped(tracks, y, NumberComparator, component => component.position)
                if (trackIndex < 0 || trackIndex >= tracks.length) {return null}
                const track = tracks[trackIndex]
                const clipIndex = Math.floor(x / ClipWidth)
                return track.trackBoxAdapter.clips.collection.getAdapterByIndex(clipIndex)
                    .match<ClipCaptureTarget>({
                        none: () => ({type: "track", track, clipIndex}),
                        some: clip => ({type: "clip", clip})
                    })
            }
        })
}