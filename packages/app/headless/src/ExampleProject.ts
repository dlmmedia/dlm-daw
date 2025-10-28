// noinspection PointlessArithmeticExpressionJS

import {PPQN} from "@dlm-daw/lib-dsp"
import {EffectFactories, InstrumentFactories, Project, ProjectEnv} from "@dlm-daw/studio-core"

const {Bar, Quarter} = PPQN

export const createExampleProject = (env: ProjectEnv): Project => {
    const project = Project.new(env)
    const {api, editing} = project
    // @ts-ignore
    const {boxA, boxB, boxC} = editing.modify(() => {
        const {to} = project.timelineBoxAdapter.box.loopArea
        to.setValue(Bar)
        const {trackBox, audioUnitBox} = api.createInstrument(InstrumentFactories.Vaporisateur)
        const noteRegionBox = api.createNoteRegion({
            trackBox: trackBox,
            position: 0,
            duration: Bar,
            loopDuration: Quarter
        })
        api.createNoteEvent({owner: noteRegionBox, position: 0, duration: Quarter, pitch: 60})
        api.createNoteEvent({owner: noteRegionBox, position: 0, duration: Quarter, pitch: 63})
        api.createNoteEvent({owner: noteRegionBox, position: 0, duration: Quarter, pitch: 67})
        api.createNoteEvent({owner: noteRegionBox, position: 0, duration: Quarter, pitch: 72})

        const boxA = api.insertEffect(audioUnitBox.midiEffects, EffectFactories.Arpeggio, 0)
        const boxB = api.insertEffect(audioUnitBox.midiEffects, EffectFactories.Pitch, 1)
        const boxC = api.insertEffect(audioUnitBox.midiEffects, EffectFactories.Zeitgeist, 2)
        return {boxA, boxB, boxC}
    }).unwrap()

    return project
}