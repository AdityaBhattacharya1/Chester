import { Position } from './Position'
import { SymbolTable } from './SymbolTable'

export class Context {
	displayName: any
	parent: any | Context
	parentEntryPosition: Position | null
	symbolTable: SymbolTable | null
	constructor(
		displayName: any,
		parent: any | Context = null,
		parentEntryPosition: Position | null = null
	) {
		this.displayName = displayName
		this.parent = parent
		this.parentEntryPosition = parentEntryPosition
		this.symbolTable = null
	}
}
