import css from "./WorkspacePage.sass?inline"
import {Terminator} from "@dlm-daw/lib-std"
import {createElement, PageContext, PageFactory} from "@dlm-daw/lib-jsx"
import {StudioService} from "@/service/StudioService.ts"
import {Html} from "@dlm-daw/lib-dom"
import {WorkspaceBuilder} from "@/ui/workspace/WorkspaceBuilder"

const className = Html.adoptStyleSheet(css, "WorkspacePage")

export const WorkspacePage: PageFactory<StudioService> = ({lifecycle, service}: PageContext<StudioService>) => {
    // const page: Nullable<string> = PageUtils.extractSecondSegment(path)
    // console.debug(page)
    const main: HTMLElement = <main/>
    const screenLifeTime = lifecycle.own(new Terminator())
    lifecycle.own(service.layout.screen.catchupAndSubscribe(owner => {
        console.debug(owner.getValue())
        screenLifeTime.terminate()
        WorkspaceBuilder.buildScreen(screenLifeTime, service.panelLayout, main, owner.getValue())
    }))
    return <div className={className}>{main}</div>
}