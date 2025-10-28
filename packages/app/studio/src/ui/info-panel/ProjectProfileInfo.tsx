import css from "./ProjectInfo.sass?inline"
import {Lifecycle} from "@dlm-daw/lib-std"
import {createElement} from "@dlm-daw/lib-jsx"
import {StudioService} from "@/service/StudioService.ts"
import {Events, Html} from "@dlm-daw/lib-dom"

const className = Html.adoptStyleSheet(css, "ProjectInfo")

type Construct = {
    lifecycle: Lifecycle
    service: StudioService
}

export const ProjectProfileInfo = ({lifecycle, service}: Construct) => {
    if (!service.hasProfile) {return "No project profile."}
    const {profile} = service
    const {meta} = profile
    const inputName: HTMLInputElement = (
        <input type="text" className="default"
               placeholder="Type in your's project name"
               value={meta.name}/>
    )
    const inputTags: HTMLInputElement = (
        <input type="text" className="default"
               placeholder="Type in your's project tags"
               value={meta.tags.join(", ")}/>
    )
    const inputDescription: HTMLTextAreaElement = (
        <textarea className="default"
                  placeholder="Type in your's project description"
                  value={meta.description}/>
    )
    const form: HTMLElement = (
        <div className="form">
            <div className="label">Name</div>
            <label info="Maximum 128 characters">{inputName}</label>
            <div className="label">Tags</div>
            <label info="Separate tags with commas">{inputTags}</label>
            <div className="label">Description</div>
            <label info="Maximum 512 characters">{inputDescription}</label>
        </div>
    )
    lifecycle.ownAll(
        Events.subscribe(form, "keydown", (event: KeyboardEvent) => {
            if (event.code === "Enter" && event.target instanceof HTMLInputElement) {event.target.blur()}
        }),
        Events.subscribe(inputName, "blur",
            () => profile.updateMetaData("name", inputName.value)),
        Events.subscribe(inputDescription, "blur",
            () => profile.updateMetaData("description", inputDescription.value)),
        Events.subscribe(inputTags, "blur",
            () => profile.updateMetaData("tags", inputTags.value.split(",").map(x => x.trim()))),
        Events.subscribe(inputName, "input", () => Html.limitChars(inputDescription, "value", 128)),
        Events.subscribe(inputDescription, "input", () => Html.limitChars(inputDescription, "value", 512))
    )
    return (
        <div className={className}>
            {form}
        </div>
    )
}