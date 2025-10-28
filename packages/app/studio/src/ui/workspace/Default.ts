import {PanelState} from "@/ui/workspace/PanelState.ts"
import {PanelType} from "@/ui/workspace/PanelType.ts"
import {Workspace} from "./Workspace.ts"
import {IconSymbol} from "@dlm-daw/studio-adapters"

const BrowserPanel = PanelState.create({
    type: "panel",
    name: "Browser",
    icon: IconSymbol.Panel,
    panelType: PanelType.BrowserPanel,
    constrains: {type: "flex", minSize: 240, maxSize: 480, flex: 0.25}
})
const DevicesPanel = PanelState.create({
    type: "panel",
    name: "Devices",
    icon: IconSymbol.Flask,
    panelType: PanelType.DevicePanel,
    notPopoutable: true,
    constrains: {type: "fixed", fixedSize: 240}
})
const NotepadPanel = PanelState.create({
    type: "panel",
    name: "Notepad",
    icon: IconSymbol.NotePad,
    panelType: PanelType.Notepad,
    notMinimizable: true,
    constrains: {type: "fixed", fixedSize: 480}
})
const ProjectInfoPanel = PanelState.create({
    type: "panel",
    name: "Project Info",
    icon: IconSymbol.Box,
    panelType: PanelType.ProjectInfo,
    notMinimizable: true,
    constrains: {type: "flex", minSize: 384, flex: 1}
})

const ModularSystem = PanelState.create({
    type: "panel",
    name: "Modular System",
    icon: IconSymbol.Box,
    panelType: PanelType.ModularSystem,
    notMinimizable: true,
    constrains: {type: "flex", minSize: 20, flex: 1}
})
export const DefaultWorkspace = Object.freeze({
    "dashboard": {
        name: "Dashboard",
        icon: IconSymbol.DLMDAW,
        hidden: true,
        content: PanelState.create({
            type: "panel",
            name: "Dashboard",
            icon: IconSymbol.DLMDAW,
            panelType: PanelType.Dashboard,
            notPopoutable: true,
            notMinimizable: true,
            constrains: {type: "flex", minSize: 0, flex: 1}
        })
    },
    "default": {
        name: "Default",
        icon: IconSymbol.Timeline,
        content: {
            type: "layout",
            orientation: "horizontal",
            contents: [
                BrowserPanel,
                {
                    type: "layout",
                    orientation: "vertical",
                    contents: [
                        PanelState.create({
                            type: "panel",
                            name: "Timeline",
                            icon: IconSymbol.Timeline,
                            panelType: PanelType.Timeline,
                            constrains: {type: "flex", minSize: 94, flex: 1}
                        }),
                        PanelState.create({
                            type: "panel",
                            name: "Editor",
                            icon: IconSymbol.Pencil,
                            panelType: PanelType.ContentEditor,
                            constrains: {type: "flex", minSize: 284, flex: 1},
                            minimized: true
                        }),
                        DevicesPanel
                    ],
                    constrains: {type: "flex", minSize: 0, flex: 1}
                },
                PanelState.create({
                    type: "panel",
                    name: "Mixer",
                    icon: IconSymbol.Mixing,
                    panelType: PanelType.Mixer,
                    constrains: {type: "flex", minSize: 20, maxSize: 480, flex: 0.25},
                    minimized: true
                })
            ],
            constrains: {type: "flex", minSize: 0, flex: 1}
        }
    },
    "mixer": {
        name: "Mixer",
        icon: IconSymbol.Mixing,
        content: {
            type: "layout",
            orientation: "horizontal",
            contents: [
                BrowserPanel,
                {
                    type: "layout",
                    orientation: "vertical",
                    contents: [
                        PanelState.create({
                            type: "panel",
                            name: "Mixer",
                            icon: IconSymbol.Mixing,
                            panelType: PanelType.Mixer,
                            notMinimizable: true,
                            constrains: {type: "flex", minSize: 0, flex: 1}
                        }),
                        DevicesPanel
                    ],
                    constrains: {type: "flex", minSize: 0, flex: 1}
                }
            ],
            constrains: {type: "flex", minSize: 20, flex: 1}
        }
    },
    "modular": {
        name: "Modular",
        icon: IconSymbol.Box,
        content: {
            type: "layout",
            orientation: "horizontal",
            contents: [
                BrowserPanel,
                {
                    type: "layout",
                    orientation: "vertical",
                    contents: [
                        ModularSystem,
                        DevicesPanel
                    ],
                    constrains: {type: "flex", minSize: 0, flex: 1}
                }
            ],
            constrains: {type: "flex", minSize: 20, flex: 1}
        }
    },
    "piano": {
        name: "Piano Tutorial Mode",
        icon: IconSymbol.Piano,
        content: PanelState.create({
            type: "panel",
            name: "Piano Tutorial Mode",
            icon: IconSymbol.Piano,
            panelType: PanelType.MidiFall,
            constrains: {type: "flex", minSize: 0, flex: 1}
        })
    },
    "project": {
        name: "Project Info",
        icon: IconSymbol.NotePad,
        content: {
            type: "layout",
            orientation: "horizontal",
            contents: [
                ProjectInfoPanel,
                NotepadPanel,
                PanelState.create({
                    type: "panel",
                    name: "Empty",
                    icon: IconSymbol.DLMDAW,
                    panelType: PanelType.EmptyFlexSpace,
                    constrains: {type: "flex", minSize: 0, flex: 1}
                })
            ],
            constrains: {type: "flex", minSize: 0, flex: 1}
        }
    },
    "meter": {
        name: "VU-Meter",
        icon: IconSymbol.VUMeter,
        content: PanelState.create({
            type: "panel",
            name: "VU-Meter",
            icon: IconSymbol.VUMeter,
            panelType: PanelType.VUMeter,
            notMinimizable: true,
            constrains: {type: "flex", minSize: 0, flex: 1}
        })
    }
} satisfies Record<string, Workspace.Screen>)

