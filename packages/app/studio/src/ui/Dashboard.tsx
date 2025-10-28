import css from "./Dashboard.sass?inline"
import {Lifecycle, TimeSpan} from "@dlm-daw/lib-std"
import {createElement, HTML} from "@dlm-daw/lib-jsx"
import {StudioService} from "@/service/StudioService.ts"
import {Html} from "@dlm-daw/lib-dom"
import {ProjectBrowser} from "@/project/ProjectBrowser"
import {Dialogs} from "@/ui/components/dialogs"
import {Colors} from "@dlm-daw/studio-core"

const className = Html.adoptStyleSheet(css, "Dashboard")

type Construct = {
    lifecycle: Lifecycle
    service: StudioService
}

export const Dashboard = ({lifecycle, service}: Construct) => {
    const time = TimeSpan.millis(new Date(service.buildInfo.date).getTime() - new Date().getTime()).toUnitString()
    return (
        <div className={className}>
            <article>
                <h1>Welcome to DLM DAW</h1>
                <h2>A new holistic exploration of music creation powered by DLM World</h2>
                <p style={{margin: "1em 0 0 0"}}>
                    This is an <span className="highlight">early prototype</span> giving you an early glimpse of the
                    development
                    state.
                </p>
                <div className="columns">
                    <div>
                        <h3>Templates</h3>
                        <div className="starters">
                            {[
                                {name: "New", click: () => service.cleanSlate()},
                                {name: "Sunset", click: () => service.loadTemplate("Sunset")},
                                {name: "Breeze", click: () => service.loadTemplate("Breeze")},
                                {name: "Shafted", click: () => service.loadTemplate("Shafted")},
                                {name: "Seek Deeper", click: () => service.loadTemplate("SeekDeeper")},
                                {name: "Fatso", click: () => service.loadTemplate("Fatso")},
                                {name: "Bury Me", click: () => service.loadTemplate("BuryMe")},
                                {
                                    name: "Bury Me (BMX Remix)",
                                    click: () => service.loadTemplate("BMX_Skyence_buryme_Remix")
                                },
                                {name: "Ben", click: () => service.loadTemplate("Ben")},
                                {name: "Liquid", click: () => service.loadTemplate("BMX_LiquidDrums")},
                                {name: "Release", click: () => service.loadTemplate("Release")},
                                {name: "Dub Techno", click: () => service.loadTemplate("Dub-Techno")}
                            ].map(({name, click}, index) => {
                                const svgSource = `viscious-speed/${String(index + 1).padStart(2, "0")}.svg`
                                return (
                                    <div onclick={click}>
                                        <HTML src={fetch(svgSource)} className="icon"/>
                                        <label>{name}</label>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <div>
                        <h3>Your Projects</h3>
                        <ProjectBrowser service={service}
                                        lifecycle={lifecycle}
                                        select={async ([uuid, meta]) => {
                                            const handler = Dialogs.processMonolog("Loading...")
                                            await service.profileService.loadExisting(uuid, meta)
                                            handler.close()
                                        }}/>
                    </div>
                </div>
                <p style={{marginTop: "2em", fontSize: "0.625em", textAlign: "center"}}>
                    Last built was <span style={{color: Colors.green}}>{time}</span>. Join our <a
                    href="https://discord.dlm-daw.studio" target="discord" style={{color: Colors.blue}}>discord
                    community</a> to stay updated! · <a href="https://github.com/dlm-daw/dlm-daw"
                                                        target="github"
                                                        style={{color: Colors.blue}}>sourcecode</a> · Built with ❤️
                </p>
            </article>
        </div>
    )
}