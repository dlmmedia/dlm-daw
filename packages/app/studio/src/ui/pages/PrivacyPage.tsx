import css from "./PrivacyPage.sass?inline"
import {createElement, PageContext, PageFactory} from "@dlm-daw/lib-jsx"
import {StudioService} from "@/service/StudioService.ts"
import {Html} from "@dlm-daw/lib-dom"
import {Colors} from "@dlm-daw/studio-core"

const className = Html.adoptStyleSheet(css, "PrivacyPage")

export const PrivacyPage: PageFactory<StudioService> = ({}: PageContext<StudioService>) => (
    <div className={className}>
        <h1>Privacy Policy</h1>
        <p style={{color: Colors.blue}}>This application respects your privacy. It does not collect personal data,
            create user accounts, or track visitors.</p>

        <h3>Local storage</h3>
        <p>Your projects and samples are stored on your own device (local file system or browser storage). No
            information is sent to external servers.</p>

        <h3>Cloud connections</h3>
        <p>If you choose to connect a cloud service (e.g. Google Drive or Dropbox), this application uses the official OAuth
            process. The access tokens are stored only in your browser or desktop app and are never shared externally.</p>

        <h3>Data usage</h3>
        <p>This application does not process, analyze, or share your data. Files remain under your control in your chosen storage
            location.</p>
    </div>
)