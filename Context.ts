import { Position } from './Position'

export class Context {
	displayName: any
	parent: any
	parentEntryPosition: Position | null
	constructor(displayName: any, parent = null, parentEntryPosition = null) {
		this.displayName = displayName
		this.parent = parent
		this.parentEntryPosition = parentEntryPosition
	}
}
