import {TerminatorUtils} from "@dlm-daw/lib-dom"
import {createElement} from "../create-element"
import {RouteLocation, RouteMatcher} from "../routes"

export const LocalLink = ({href}: { href: string }) => TerminatorUtils
    .watchWeak<HTMLAnchorElement>(
        <a href={href}
           onclick={(event: Event) => {
               event.preventDefault()
               RouteLocation.get().navigateTo(href)
           }} link/>,
        weakRef => RouteLocation.get().catchupAndSubscribe(location =>
            weakRef.deref()?.classList.toggle("active", RouteMatcher.match(location.path, href))))