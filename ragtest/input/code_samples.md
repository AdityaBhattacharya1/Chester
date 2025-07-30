\*\*# C to Chester Parallel Examples

This document provides a series of parallel code snippets in C and the Chester programming language. Use these examples to populate your vector database and improve retrieval-augmented generation for transpiling C code into Chester.

---

## Table of Contents

1. [Basic Assignments](#basic-assignments)
2. [Arithmetic Expressions](#arithmetic-expressions)
3. [Comparison and Logical Expressions](#comparison-and-logical-expressions)
4. [Conditional Statements](#conditional-statements)
5. [Loops](#loops)
6. [List Operations](#list-operations)
7. [Function Definitions](#function-definitions)
8. [Function Calls & Arguments](#function-calls--arguments)
9. [Recursion](#recursion)
10. [Built-In Functions](#built-in-functions)
11. [Complex Example](#complex-example)

---

## Basic Assignments

```c
// C: Integer assignment
int x = 42;
```

```chester
// Chester
let x = 42
```

```c
// C: String assignment
char *name = "Alice";
```

```chester
// Chester
let name = "Alice"
```

---

## Arithmetic Expressions

```c
// C: Mixed arithmetic
int result = a + b * c - d / e;
```

```chester
// Chester
let result = a + b * c - d / e
```

```c
// C: Exponentiation via pow()
double p = pow(2, 3);
```

```chester
// Chester (using ^ for exponent)
let p = 2 ^ 3
```

---

## Comparison and Logical Expressions

```c
// C: Comparison
int flag = (x >= y);
```

```chester
// Chester
let flag = x >= y
```

```c
// C: Logical AND
if ((a > b) && (c != 0)) {
    do_something();
}
```

```chester
// Chester
if a > b and c != 0 then
    do_something()
end
```

---

## Conditional Statements

```c
// C: If-else
if (score >= 90) {
    grade = 'A';
} else if (score >= 80) {
    grade = 'B';
} else {
    grade = 'C';
}
```

```chester
// Chester
if score >= 90 then
    let grade = 'A'
elif score >= 80 then
    let grade = 'B'
else
    let grade = 'C'
end
```

---

## Loops

```c
// C: For-loop increasing
for (int i = 0; i < n; ++i) {
    sum += arr[i];
}
```

```chester
// Chester
for i = 0 to n-1 step 1 then
    let sum = sum + arr[i]
end
```

```c
// C: While-loop
while (x < 100) {
    x *= 2;
}
```

```chester
// Chester
while x < 100 then
    let x = x * 2
end
```

---

## List Operations

```c
// C: Array initialization
int nums[4] = {1, 2, 3, 4};
```

```chester
// Chester
let nums = [1, 2, 3, 4]
```

```c
// C: Access element and length (with macro)
int last = nums[3];
int len = sizeof(nums)/sizeof(nums[0]);
```

```chester
// Chester
let last = nums[3]
let len = length(nums)
```

```c
// C: Looping over list
for (int k = 0; k < len; ++k) {
    printf("%d", nums[k]);
}
```

```chester
// Chester
for k = 0 to length(nums)-1 step 1 then
    print(nums[k])
end
```

---

## Function Definitions

```c
// C: Simple add function
int add(int x, int y) {
    return x + y;
}
```

```chester
// Chester
func add(x, y) -> x + y
```

```c
// C: Function with no return (void)
void greet(char *name) {
    printf("Hello, %s!", name);
}
```

```chester
// Chester
func greet(name) -> print(name)
```

---

## Function Calls & Arguments

```c
// C: Calling with literals
int val = add(3, 4);
```

```chester
// Chester
let val = add(3, 4)
```

```c
// C: Nested calls
int x = max(min(a, b), c);
```

```chester
// Chester
let x = max(min(a, b), c)
```

---

## Recursion

```c
// C: Factorial
int fact(int n) {
    if (n <= 1) return 1;
    return n * fact(n - 1);
}
```

```chester
// Chester
func fact(n)
    if n <= 1 then
        1
    else
        n * fact(n - 1)
    end
```

```c
// C: Fibonacci
int fib(int n) {
    if (n < 2) return n;
    return fib(n-1) + fib(n-2);
}
```

```chester
// Chester
func fib(n)
    if n < 2 then
        n
    else
        fib(n-1) + fib(n-2)
    end
```

---

## Built-In Functions

```c
// C: Read integer input
int x;
scanf("%d", &x);
```

```chester
// Chester
let x = inputInt()
```

```c
// C: Execute external command
system("ls -la");
```

```chester
// Chester
run("ls -la")
```

---

## Complex Example

```c
// C: Compute sum of squares of positive numbers in an array
int sumSquares(int *arr, int n) {
    int total = 0;
    for (int i = 0; i < n; ++i) {
        if (arr[i] > 0) {
            total += arr[i] * arr[i];
        }
    }
    return total;
}
```

```chester
// Chester
func sumSquares(arr, n)
    let total = 0
    for i = 0 to n-1 step 1 then
        if arr[i] > 0 then
            let total = total + arr[i] ^ 2
        end
    end
    total
```
