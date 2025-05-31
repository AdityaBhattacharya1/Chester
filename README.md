<img src="./assets/hero.svg" />

<br />

# Chester: A Dual-Core LLM Benchmarking Suite

Chester is a hobbyist programming language based LLM Benchmarking tool designed for simplicity and experimentation. It consists of an interpreted language and a RAG-based transpilation engine which converts C code into Chester code, compares the outputs for N iterations and benchmarks each model's capabilities against the total number of iterations each one required.

# Why tho?

For the programming language aspect, after completing a course on compiler designs on NPTEL, I wanted to get a bit hands on with how programming languages work. What better way to do that than to create one from scratch - at least an interpreted one.

As for the transpilation and benchmarking, since the programming language is Turing complete but still not stable enough for most programming paradigms I wanted to test the limits of AI creativity in generating various alternatives on the basis of a pre-defined set of grammar.

## Features

-   **Simple Syntax:** Chester aims for a clean and intuitive syntax, borrowing ideas from languages like Python and JavaScript.
-   **Dynamic Typing:** Variable types are checked during runtime, offering flexibility and ease of use.
-   **Basic Data Types:** Supports numbers, strings, and lists as fundamental data types.
-   **Functions:** Define and call your own functions to create reusable code blocks.
-   **Standard Library:** Includes a set of built-in functions for common tasks like printing, input, and list manipulation.
-   **REPL (Read-Eval-Print Loop):** An interactive environment for experimenting with Chester code.
-   **CLI (Command Line Interface) Based:** A CLI based tool helps run any file you have on the fly.
-   **Transpilation Engine:** A RAG-based transpilation engine for testing the creative capabilities of various models.

## Getting Started

### Prerequisites

-   **Node.js:** Chester is implemented in TypeScript and requires Node.js to run. Download and install it from [https://nodejs.org/](https://nodejs.org/).
-   **TypeScript:** You'll need the TypeScript compiler to build the project. Install it globally using npm:
-   **Python:** The transpilation engine is coded in Python so you'll need that too.

    ```bash
    npm install -g typescript
    ```

-   **ts-node:** To run the REPL directly, install `ts-node` globally:

    ```bash
    npm install -g ts-node
    ```

### Installation

1.  **Clone the Repository:**

    ```bash
    git clone https://github.com/AdityaBhattacharya1/Chester
    cd Chester
    ```

2.  **Install Dependencies:**

    ```bash
    npm install
    ```

3.  **For transpilation engine:**

    ```bash
    cd transpilation-engine
    pip install -r requirements.txt
    ```

### Running the REPL

To start the interactive REPL, use the following command:

```bash
ts-node shell.ts
```

Or run your own chester file by creating a `.ct` file and running:

```bash
run("test.ct")
```

inside the interactive REPL!

### Using the CLI

In order to use the CLI instead, use the following command:

```bash
ts-node cli.ts <FILENAME>.ct
```

### Benchmarking

Finally, for running the benchmarks follow the given steps:

1. First set the environment variables inside `.env`

    ```bash
    cp .env.example .env
    ```

2. By default, the following model providers are being tested:

-   Azure OpenAI
-   OpenAI
-   Gemini
-   DeepSeek V3 Base
-   Deepseek R1 0528 Qwen3 8B
-   Sarvam AI: Sarvam-M
-   Google: Gemma 3n 4B
-   Meta: Llama 3.3 8B Instruct
-   Microsoft: Phi 4 Reasoning Plus
-   THUDM: GLM Z1 32B

3. Run the benchmarks:

    ```bash
    python benchmark.py
    ```

    By default a simple hello world and addition code is run for tester. However, feel free to change the code to be as complicated or as simple as you want.

    > [!NOTE]  
    > The benchmark runs under the assumption that the C code provided is valid and functional. In case erroneous code is provided, the benchmark's accuracy will be affected.

## Language Syntax

### Variables

Variables are declared using the `let` keyword:

```chester
let x = 10
let name = "Chester"
```

### Data Types

-   **Numbers:** Integers and floating-point numbers.

    ```chester
    let age = 30
    let price = 99.99
    ```

-   **Strings:** Text enclosed in double quotes.

    ```chester
    let message = "Hello, world!"
    ```

-   **Lists:** Ordered collections of values enclosed in square brackets.

    ```chester
    let numbers = [1, 2, 3, 4, 5]
    let fruits = ["apple", "banana", "orange"]
    ```

### Operators

Chester supports the following operators:

-   **Arithmetic:** `+`, `-`, `*`, `/`
-   **Comparison:** `==`, `!=`, `>`, `<`, `>=`, `<=`
-   **Logical:** `and`, `or`, `not`

### Control Flow

-   **If Statements:**

    ```chester
    let age = 20
    if (age >= 18) then
        print("You are an adult")
    else
        print("You are a minor")
    end
    ```

-   **For Loops:**

    ```chester
    let numbers = [1, 2, 3]
    for i = 0 to length(numbers) then
        print(numbers/i)
    end
    ```

### Functions

Functions are defined using the `func` keyword:

```chester
func add(x, y)
    return x + y
end

let sum = add(5, 3)
print(sum)  # Output: 8
```

### Built-in Functions

-   **`print(value)`:** Prints the value to the console.
-   **`length(list)`:** Returns the length of a list.
-   **`append(list, value)`:** Appends a value to the end of a list.
-   **`input()`:** Reads a line of text from the user.
-   **`inputInt()`:** Reads an integer from the user.

## Examples

### Hello, World!

```chester
print("Hello, world!")
```

### Calculating Factorial

```chester
func factorial(n)
    if (n <= 1) then
        return 1
    else
        return n * factorial(n - 1)
    end
end

let result = factorial(5)
print(result)  # Output: 120
```

### List Manipulation

```chester
let numbers = [1, 2, 3]
append(numbers, 4)
print(numbers)  # Output: [1, 2, 3, 4]
print(length(numbers))  # Output: 4
```

## Contributing

Chester is an open-source project, and contributions are welcome! If you'd like to contribute, please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Implement your changes.
4.  Write tests to ensure your changes are working correctly.
5.  Submit a pull request.
