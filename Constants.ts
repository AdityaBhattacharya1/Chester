export const TT_INT = 'INT'
export const TT_FLOAT = 'FLOAT'
export const TT_STRING = 'STRING'
export const TT_PLUS = 'PLUS'
export const TT_MINUS = 'MINUS'
export const TT_MUL = 'MUL'
export const TT_DIV = 'DIV'
export const TT_LPAREN = 'LPAREN'
export const TT_RPAREN = 'RPAREN'
export const TT_LSQUARE = 'LSQUARE'
export const TT_RSQUARE = 'RSQUARE'
export const TT_EOF = 'EOF'
export const TT_POW = 'POW'

export const TT_IDENTIFIER = 'IDENTIFIER'
export const TT_KEYWORD = 'KEYWORD'
export const TT_EQ = 'EQ'

export const TT_EE = 'EE'
export const TT_NE = 'NE'
export const TT_LT = 'LT'
export const TT_GT = 'GT'
export const TT_LTE = 'LTE'
export const TT_GTE = 'GTE'

export const TT_COMMA = 'COMMA'
export const TT_ARROW = 'ARROW'
export const TT_NEWLINE = 'NEWLINE'

export const KEYWORDS = [
	'let',
	'and',
	'or',
	'not',
	'if',
	'elif',
	'else',
	'for',
	'to',
	'step',
	'while',
	'func',
	'then',
	'end',
	'return',
	'continue',
	'break',
]

export const DIGITS = '0123456789.'
export const LETTERS =
	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')
export const ALPHANUM = LETTERS + DIGITS
