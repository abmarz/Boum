# Boum

![Boum Logo](https://github.com/abmarz/Boum/blob/main/docs/Boum%20Logo.png?raw=true)

_We put a lot of thought into this logo's design. The left sail represents our ancestors; the right sail, our future. The incomplete left reflects our mysterious past, while the fuller right symbolizes the promise of tomorrow._

---

## What is Boum?

**Boum** is a statically typed programming language written by and for Kuwaitis. It merges expressive code with expressive culture, allowing you to write in a dialect that’s not only functional, but poetic.

Built off a **m3arab** foundation (a hybrid of Arabic and Latin characters) Boum borrows this expressive code-switching style common in everyday digital Kuwaiti speech. M3arab blends Arabic words with English syntax, often writing Arabic phonetically using the Latin alphabet and numbers (e.g., `5al`, `6alama`, `insa5`). It reflects how we text, think, speak, and now, how we code.

Inspired by the historic **Boum** vessel that once connected our shores to the world, this language does the same with syntax.

---

## 🌊 Origin Story

Three centuries ago, a group of families left the harsh desert in search of a better life. They reached a radiant coastline atop the Arabian Gulf. There, they built a community enriched with faith, family, and tradition.

But across that ocean was a bigger world. So they built the **Boum**, a wooden vessel that carried them into new lands, new trades, and eventually helped build a country: **Kuwait**.

This language is a modern version of that journey. A voyage, but in code.

---

## Key Features

- 🇰🇼 Kuwaiti-flavored syntax (expressive and symbolic)
- 🧠 Statically typed with clear semantic errors
- 🔂 Full compilation pipeline (Parse → Analyze → Optimize → Generate)

---

## 🗝️ Boum Keywords Reference

| Boum Keyword  | Meaning             | JavaScript Equivalent  | Python Equivalent | Origin / Note                      |
| ------------- | ------------------- | ---------------------- | ----------------- | ---------------------------------- |
| `5al`         | Declare variable    | `let x = ...;`         | `x = ...`         | From "خَلّ" (declare)              |
| `insa5/ensa5` | Print to console    | `console.log(x);`      | `print(x)`        | From "انسخ", (trasncribe)          |
| `dala`        | Function definition | `function f(...) {}`   | `def f(...):`     | From "دالة", (arithmetic function) |
| `rd/rid`      | Return statement    | `return x;`            | `return x`        | Short for "رد", meaning “return”   |
| `6alama`      | While loop          | `while (cond) { ... }` | `while cond:`     | From "طالما", meaning "as long as" |

---

## Some Cool 😎 Code Examples

### 📌 Fibonacci Sequence (first 10 digits)

```boum
5al a = 0
5al b = 1

ensa5(a)
ensa5(b)

5al i = 2

6alama(i < 10): (
  5al next = a + b
  ensa5(next)
  a = b
  b = next
  i = i + 1
)
```

_Boum’s version of a function that prints out the first 10 digits of the Fibonacci Sequence. Wanna see something cooler? Head on to our examples and find the example file marked `fibonacci.boum`. This file contains a Boum function that takes in an nth input and gives you the nth digit in the Fibonacci Sequence! That is, it will output the JS version that you can just place in an online program interpreter like [TiO](https://tio.run/#javascript-node) and see the result_ 😁

### 📌 Variable Declaration and Print

```boum
5al x = 10
insa5(x)
```

_Boum’s version of `let x = 10; console.log(x);` `5al` is like "let", and `insa5` means "print"._

---

### 📌 Function with Parameters and Return

```boum
dala add(a: num, b: num) -> num: (
  rd a + b
)
insa5(add(5, 3))
```

_This defines a function using `dala`, Arabic for "function". It takes two numbers, returns their sum, and prints it._

---

### 📌 While Loop

```boum
5al i = 0
6alama(i < 3): (
  insa5(i)
  i = i + 1
)
```

_The Boum keyword `6alama` means "as long as" in arabic, making loops read like a story. The arabic language strikes again!_

### 📌 & many many more that you can find inside the examples folder! See the next section on how to run them! 👇 👇 👇

---

## Compile & Run

### Running examples

```bash
node src/boum.js <filename> <outputType>
```

Where `<outputType>` is one of:

- `parsed` – syntax is okay
- `analyzed` – semantic analysis
- `optimized` – optimized AST
- `js` – final JavaScript output

---

## Project Structure (Code)

```
src/
├── analyzer.js      # Performs static analysis
├── boum.ohm         # The Boum grammar
├── compiler.js      # Main compile pipeline
├── core.js          # AST node definitions
├── generator.js     # JS code generator
├── optimizer.js     # AST optimizer
├── parser.js        # Parser using Ohm
test/
├── *.test.js        # Coverage: parser, analyzer, generator, optimizer
```

---

## 🌐 See it Live

📎 [abmarz.github.io/Boum](https://abmarz.github.io/Boum/)

---

## 💡 Inspiration Statement

> _“They [our ancestors] charted a course with sails and stars. We're doing it with syntax and semicolons.”_

---

## Authors

**Abdullah Al Marzouq** + **Ali Al Aryan**

---

## Acknowledgements

[Dr. Toal!](https://github.com/rtoal) No seriously you deserve much more than a thank you Dr. Toal. We couldn’t have done this without your help and flexibility. Can't believe this is our last class with you ever, we're going to miss you ❤️

---
