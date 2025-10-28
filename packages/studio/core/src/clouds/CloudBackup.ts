import {
    DefaultObservableValue,
    Errors,
    isInstanceOf,
    Progress,
    RuntimeNotifier,
    RuntimeSignal,
    TimeSpan,
    unitValue
} from "@dlm-daw/lib-std"
import {CloudHandler} from "./CloudHandler"
import {CloudBackupSamples} from "./CloudBackupSamples"
import {CloudBackupProjects} from "./CloudBackupProjects"
import {CloudAuthManager} from "./CloudAuthManager"
import {CloudService} from "./CloudService"
import {ProjectSignals} from "../project/ProjectSignals"
import {Promises} from "@dlm-daw/lib-runtime"
import {Browser} from "@dlm-daw/lib-dom"

export namespace CloudBackup {
    export const backup = async (cloudAuthManager: CloudAuthManager, service: CloudService) => {
        const DialogMessage = `DLM DAW will never store or share your personal account details!

                                        Dropbox requires permission to read "basic account info" such as your name and email, but DLM DAW does not use or retain this information. We only access the files you choose to synchronize.
                                        
                                        Clicking 'Sync' may open a new tab to authorize your dropbox.`

        const approved = await RuntimeNotifier.approve({
            headline: "DLM DAW and your data",
            message: DialogMessage,
            approveText: "Sync",
            cancelText: "Cancel"
        })
        if (!approved) {return}
        try {
            const handler = await cloudAuthManager.getHandler(service)
            await CloudBackup.backupWithHandler(handler, service)
            await RuntimeNotifier.info({
                headline: "Cloud Backup",
                message: "Everything is up to date."
            })
        } catch (reason: unknown) {
            if (Errors.isAbort(reason)) {return}
            console.warn(reason)
            await RuntimeNotifier.info({
                headline: `Could not sync`,
                message: String(reason)
            })
        } finally {
            RuntimeSignal.dispatch(ProjectSignals.StorageUpdated)
        }
    }

    export const backupWithHandler = async (cloudHandler: CloudHandler, service: CloudService) => {
        const progressValue = new DefaultObservableValue<unitValue>(0.0)
        const notification = RuntimeNotifier.progress({headline: `Backup with ${service}`, progress: progressValue})
        const log = (text: string) => notification.message = text
        const [progressSamples, progressProjects] = Progress.split(progress => progressValue.setValue(progress), 2)
        const lockPath = "lock.json"
        type Lock = { id: string, created: string }
        let canReleaseLock = false
        try {
            const {status, error, value} = await Promises.tryCatch(cloudHandler.download(lockPath))
            console.debug("LOCK", status)
            if (status === "resolved") {
                const lock: Lock = JSON.parse(new TextDecoder().decode(value))
                if (lock.id !== Browser.id()) {
                    // another browser is currently doing a backup
                    const lockCreated = new Date(lock.created)
                    const timeString = TimeSpan.millis(lockCreated.getTime() - new Date().getTime()).toString()
                    const approved = await RuntimeNotifier.approve({
                        headline: "Cloud Locked!",
                        message: `There is a lock on the backup folder since ${timeString}. 
                        This means the account is currently busy with a backup or a previous backup did not finish properly. If you share this account, please coordinate with the other person or simply wait a few minutes and try again. Ignoring the lock while another backup is still running can cause the cloud data to become inconsistent.`,
                        approveText: "Wait",
                        cancelText: "Ignore"
                    })
                    if (approved) {
                        return Promise.reject(Errors.AbortError)
                    }
                }
            } else if (!isInstanceOf(error, Errors.FileNotFound)) {
                await RuntimeNotifier.info({
                    headline: "Error reading lock file",
                    message: "Abort backup."
                })
                throw error
            }
            canReleaseLock = true
            const json: Lock = {id: Browser.id(), created: new Date().toISOString()}
            await cloudHandler.upload(lockPath, new TextEncoder().encode(JSON.stringify(json)).buffer)
            await CloudBackupSamples.start(cloudHandler, progressSamples, log)
            await CloudBackupProjects.start(cloudHandler, progressProjects, log)
        } finally {
            if (canReleaseLock) {
                await cloudHandler.delete(lockPath)
            }
            progressValue.terminate()
            notification.terminate()
        }
    }
}