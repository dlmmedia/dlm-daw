export namespace FilePickerAcceptTypes {
    export const WavFiles: FilePickerOptions = {
        types: [{
            description: "wav-file",
            accept: {"audio/wav": [".wav"]}
        }]
    }
    export const ProjectSyncLog: FilePickerOptions = {
        types: [{
            description: "DLM DAW sync-log-file",
            accept: {"application/octet-stream": [".odsl"]}
        }]
    }

    export const ProjectFileType: FilePickerAcceptType = {
        description: "DLM DAW project",
        accept: {"application/octet-stream": [".od"]}
    }

    export const ProjectBundleFileType: FilePickerAcceptType = {
        description: "DLM DAW project bundle",
        accept: {"application/octet-stream": [".odb"]}
    }

    export const DawprojectFileType: FilePickerAcceptType = {
        description: "dawproject",
        accept: {"application/octet-stream": [".dawproject"]}
    }
    export const JsonFileType: FilePickerAcceptType = {
        description: "json",
        accept: {"application/json": [".json"]}
    }

}