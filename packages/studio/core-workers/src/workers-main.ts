import {Messenger} from "@dlm-daw/lib-runtime"
import {OpfsWorker, SamplePeakWorker} from "@dlm-daw/lib-fusion"

const messenger: Messenger = Messenger.for(self)

OpfsWorker.init(messenger)
SamplePeakWorker.install(messenger)

console.debug("workers about to be initialized.")

messenger.channel("initialize").send("ready")