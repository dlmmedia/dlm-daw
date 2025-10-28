import {Dialog} from "@/ui/components/Dialog"
import {IconSymbol} from "@dlm-daw/studio-adapters"
import {Surface} from "@/ui/surface/Surface"
import {Promises} from "@dlm-daw/lib-runtime"
import {createElement} from "@dlm-daw/lib-jsx"
import {Colors} from "@dlm-daw/studio-core"

export const showStoragePersistDialog = (): Promise<void> => {
    const {resolve, promise} = Promise.withResolvers<void>()
    const dialog: HTMLDialogElement = (
        <Dialog headline="Firefox Must Allow Storage Access"
                icon={IconSymbol.System}
                cancelable={false}
                buttons={[{
                    text: "Allow",
                    primary: true,
                    onClick: handler => Promises.tryCatch(navigator.storage.persist()).then(({status, value}) => {
                        if (status === "resolved" && value) {
                            console.debug("Firefox now persists storage.")
                            handler.close()
                            resolve()
                        }
                    })
                }]}>
            <div style={{padding: "1em 0"}}>
                <h2 style={{color: Colors.red}}>Data loss is probable if you do not take action.</h2>
                <p>To make this a permanent friendship, please go to:</p>
                <p style={{color: Colors.yellow}}>Preferences - Privacy & Security - Cookies & Site Data - Manage
                    Exceptions...</p>
                <p>and add dlm-daw.studio to the list. You will never be bothered again.</p>
            </div>
        </Dialog>
    )
    Surface.get().body.appendChild(dialog)
    dialog.showModal()
    return promise
}