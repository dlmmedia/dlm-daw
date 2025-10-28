import css from "./ImprintPage.sass?inline"
import {createElement, PageContext, PageFactory} from "@dlm-daw/lib-jsx"
import {StudioService} from "@/service/StudioService.ts"
import {Html} from "@dlm-daw/lib-dom"
import {Colors} from "@dlm-daw/studio-core"

const className = Html.adoptStyleSheet(css, "ImprintPage")

export const ImprintPage: PageFactory<StudioService> = ({}: PageContext<StudioService>) => (
    <div className={className}>
        <h1>Imprint</h1>
        <h3>In accordance with § 5 TMG (German Telemedia Act)</h3>
        <h4>Responsible for content:</h4>
        <p>
            <span style={{color: Colors.cream}}>André Michelle</span><br/>
            <span style={{color: Colors.dark}}>Cologne, Germany</span>
        </p>
        <p>
            This website is a personal, non-commercial project.<br/>
            <span style={{color: Colors.red}}>No tracking, no data collection, no user accounts.</span>
        </p>
        <p>
            This imprint is provided to comply with German law.
        </p>
    </div>
)