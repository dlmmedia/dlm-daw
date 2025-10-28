import {Predicate} from "@dlm-daw/lib-std"
import {Box, Vertex} from "@dlm-daw/lib-box"
import {SelectableVertex} from "./SelectableVertex"

export const isVertexOfBox = (predicate: Predicate<Box>): Predicate<SelectableVertex> => (vertex: Vertex) => predicate(vertex.box)