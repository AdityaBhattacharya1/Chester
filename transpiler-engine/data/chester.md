=============================
Chester Programming language
=============================

1. Basic Grammar Rules:

    Program: A series of statements (functions, variable assignments, expressions, etc.)

program ::= statement+

Statements: Can be a variety of constructs: variable assignments, function definitions, loops, conditionals, or expressions.

    statement   ::= var_assign
                |  function_definition
                |  expression
                |  loop
                |  conditional
                |  break
                |  continue

2. Expressions:

Expressions can be numbers, strings, function calls, list accesses, and operations.

```
expression  ::= arithmetic_expression
            |  comparison_expression
            |  logical_expression
            |  atom
```

-   **Arithmetic Expressions**:

    ```
    arithmetic_expression ::= expression ( '+' | '-' | '*' | '/' | '^' ) expression
    ```

-   **Comparison Expressions**:

    ```
    comparison_expression ::= expression ( '==' | '!=' | '<' | '>' | '<=' | '>=' ) expression
    ```

-   **Logical Expressions**:

    ```
    logical_expression ::= expression ( 'and' | 'or' ) expression
    ```

-   **Atom**: An atom can be a number, string, variable, list, or a grouped expression.

    ```
    atom        ::= number
                |  string
                |  identifier
                |  '(' expression ')'
                |  list_expression
                |  function_call
    ```

-   **Function Calls**:

    ```
    function_call ::= identifier '(' arguments ')'
    arguments     ::= expression (',' expression)*
    ```

    Variable Assignment:

var_assign ::= 'let' identifier '=' expression

Lists:

list_expression ::= '[' elements ']'
elements ::= expression (',' expression)\*

Function Definitions:

function_definition ::= 'func' identifier '(' arg_list ')' '->' expression
arg_list ::= identifier (',' identifier)\*

Control Flow:

    If-Else Statements:

conditional ::= 'if' expression 'then' statements ('elif' expression 'then' statements)\* 'else' statements 'end'

Loops:

        loop         ::= 'for' identifier '=' expression 'to' expression 'step' expression 'then' statements 'end'
                      |  'while' expression 'then' statements 'end'

3. Built-In Functions:

You have a set of built-in functions like print, input, length, etc. The syntax for invoking them is consistent with function calls:

```
function_call   ::= 'print'        '(' expression ')'
                  | 'printReturn'  '(' expression ')'
                  | 'input'        '(' ')'
                  | 'inputInt'     '(' ')'
                  | 'clear'        '(' ')'
                  | 'cls'          '(' ')'             // alias of clear
                  | 'isNum'        '(' expression ')'
                  | 'isStr'        '(' expression ')'
                  | 'isList'       '(' expression ')'
                  | 'isFunc'       '(' expression ')'
                  | 'append'       '(' expression ',' expression ')'
                  | 'pop'          '(' expression ')'
                  | 'concat'       '(' expression ',' expression ')'
                  | 'length'       '(' expression ')'
                  | 'run'          '(' string ')'

```

Identifiers (e.g., variable names, function names, or built-ins) and literals (numbers, strings, lists) all qualify as valid atoms elsewhere in the grammar.

Any call to one of the above built-ins must match its exact name (case-sensitive) and arity. Invoking a built in with the wrong number of arguments triggers a "RuntimeError: ArgumentMismatch".

Error-Prone Areas and Potential Bugs:

    Function Definitions with Arrow (->):

        The use of -> for function definitions is not typical in many programming languages. It can cause confusion or misinterpretation by users not familiar with this syntax. It's better to standardize it as function_name(arg1, arg2) { ... } or something more conventional.

        The arrow operator can lead to issues when used inconsistently across the language, especially when it comes to handling return values inside functions.

    List Handling:

        List handling could be error-prone. The current implementation does not seem to check for empty lists properly in cases like len([]), which can throw unexpected errors if not handled.

        elements/i in the join function uses a non-existent indexing syntax. List accesses should be done with elements[i] instead of elements/i.

    Scope Issues with Variable Assignments:

        Variable scope handling might be problematic when using nested blocks, especially within functions or control flow constructs. The assignment of values could overwrite previous values, leading to unexpected behavior. Ensure proper scoping rules are defined, and variables are correctly shadowed.

    Null Handling in Built-in Functions:

        The built-in function handling (e.g., run, print) should ensure that they handle invalid input or null values gracefully. For instance, run("nonexistent.myopl") should throw a well-defined error, not just null.

    Inconsistent Expression Parsing:

        The grammar and the parser for expressions like let x = 3 + 4 could lead to ambiguities in the parsing process, especially when operators like +, -, *, / are involved. Parentheses should be used to clarify expression precedence.

        There's potential confusion in operators like = (assignment) vs == (equality). Make sure these are clearly differentiated and handled correctly in parsing.

    Unnecessary Redefinition of Variables:

        Variables are being redefined in some areas, such as in the loop within join. Example: let result = result + elements[i]. The let keyword should not be used to redefine a variable unless it is explicitly re-assigned. This can lead to unexpected behavior and re-initialization of variables.

    Division by Zero:

        There's a risk of division by zero when using arithmetic operations. For example, if the step value in a for loop or an arithmetic operation is zero, the interpreter should handle such cases properly and throw a runtime error.

    Implicit Type Handling:

        Type safety is somewhat loose in your implementation. For example, operations like let result = result + elements[i] assume the type is compatible. A check should be added to ensure the types are correct before performing such operations, to avoid runtime errors.
