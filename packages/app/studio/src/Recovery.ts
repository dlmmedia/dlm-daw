import {Option, Provider, UUID} from "@dlm-daw/lib-std"
import {Promises} from "@dlm-daw/lib-runtime"
import {Project, ProjectMeta, ProjectProfile, Workers} from "@dlm-daw/studio-core"
import {StudioService} from "@/service/StudioService.ts"

export class Recovery {
    static readonly #RESTORE_FILE_PATH = ".backup"

    readonly #service: StudioService

    constructor(service: StudioService) {this.#service = service}

    async restoreProfile(): Promise<Option<ProjectProfile>> {
        const backupResult = await Promises.tryCatch(Workers.Opfs.list(Recovery.#RESTORE_FILE_PATH))
        if (backupResult.status === "rejected" || backupResult.value.length === 0) {return Option.None}
        const readResult = await Promises.tryCatch(Promise.all([
            Workers.Opfs.read(`${Recovery.#RESTORE_FILE_PATH}/uuid`)
                .then(x => UUID.validateBytes(x)),
            Workers.Opfs.read(`${Recovery.#RESTORE_FILE_PATH}/project.od`)
                .then(x => Project.load(this.#service, x.buffer as ArrayBuffer)),
            Workers.Opfs.read(`${Recovery.#RESTORE_FILE_PATH}/meta.json`)
                .then(x => JSON.parse(new TextDecoder().decode(x.buffer as ArrayBuffer)) as ProjectMeta),
            Workers.Opfs.read(`${Recovery.#RESTORE_FILE_PATH}/saved`)
                .then(x => x.at(0) === 1)
        ]))
        const deleteResult = await Promises.tryCatch(Workers.Opfs.delete(Recovery.#RESTORE_FILE_PATH))
        console.debug(`delete backup: "${deleteResult.status}"`)
        if (readResult.status === "rejected") {return Option.None}
        const [uuid, project, meta, saved] = readResult.value
        const profile = new ProjectProfile(uuid, project, meta, Option.None, saved)
        console.debug(`restore ${profile}, saved: ${saved}`)
        return Option.wrap(profile)
    }

    createBackupCommand(): Option<Provider<Promise<void>>> {
        return this.#service.profileService.getValue().map((profile: ProjectProfile) => async () => {
            console.debug("backup project")
            const {project, meta, uuid} = profile
            return Promises.tryCatch(Promise.all([
                Workers.Opfs.write(`${Recovery.#RESTORE_FILE_PATH}/uuid`, uuid),
                Workers.Opfs.write(`${Recovery.#RESTORE_FILE_PATH}/project.od`, new Uint8Array(project.toArrayBuffer())),
                Workers.Opfs.write(`${Recovery.#RESTORE_FILE_PATH}/meta.json`, new TextEncoder().encode(JSON.stringify(meta))),
                Workers.Opfs.write(`${Recovery.#RESTORE_FILE_PATH}/saved`, new Uint8Array([profile.saved() ? 1 : 0]))
            ])).then(result => console.debug(`backup result: ${result.status}`))
        })
    }
}