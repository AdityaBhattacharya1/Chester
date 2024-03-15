import { Position } from './Position'
import { SymbolTable } from './SymbolTable'

export class Context {
	displayName: any
	parent: any
	parentEntryPosition: Position | null
	symbolTable: SymbolTable | null
	constructor(displayName: any, parent = null, parentEntryPosition = null) {
		this.displayName = displayName
		this.parent = parent
		this.parentEntryPosition = parentEntryPosition
		this.symbolTable = null
	}
}
