# VitalsScript Compiler

VitalsScript is a Domain-Specific Language (DSL) built for the medical and clinical domain. It lets you write structured programs for patient data entry, vital sign measurement, computed health metric calculation, and clinical report display — using simple, domain-aligned syntax instead of generic programming keywords.

The compiler is implemented entirely in **TypeScript** and delivered as an interactive, web-based IDE built with **React** and **Vite**. No installation is required to use it — it runs entirely in the browser.

## Why VitalsScript?

General-purpose languages like Python, Java, or C impose a steep learning curve on clinicians and biomedical professionals who aren't trained software engineers. VitalsScript closes that gap with vocabulary that mirrors real clinical workflows:

```
patient weight = 75;
patient height = 180;
calculate height_m = height / 100;
calculate bmi = weight / (height_m * height_m);
display "--- MEDICAL REPORT ---";
display "Calculated BMI:";
display bmi;
```

- `patient` — declares a patient-specific data variable
- `measure` — declares an observed measurement
- `calculate` — performs a derived computation
- `display` — outputs a clinical report value or message

## Features

- **Domain-specific syntax** readable by non-programmers in clinical settings
- **Arithmetic expressions** with standard operator precedence (`+ - * /`)
- **Conditionals and loops** (`if`, `while`)
- **Numeric and string literals**, including floating-point numbers
- **Line-numbered error reporting** for both lexical and syntax errors
- **Error recovery** — analysis continues past errors so multiple issues are reported in a single pass
- **No target code on error** — JavaScript is only generated when the source is completely error-free
- **Infinite-loop safeguard** — every generated `while` loop is capped at 1,000 iterations to prevent the browser from hanging
- **Real-time compilation** — recompiles automatically 300ms after you stop typing

## The Web IDE

The IDE is a four-panel interface:

| Panel | Description |
|---|---|
| **VitalsScript Input Stream** | Line-numbered code editor |
| **Diagnostic Logs** | Lexical/syntax errors with line numbers, or program output if error-free |
| **Semantic Parser Topology** | Real-time, color-coded AST viewer showing the parse tree |
| **Vitals Telemetry Chart** | Plots numeric output values on a glowing SVG line chart |

## Compiler Pipeline

VitalsScript follows a classic three-phase compiler architecture:

1. **Lexical Analysis** (`Lexer.ts`) — a single-pass character scanner that produces a token stream, recognizing keywords, identifiers, numbers, strings, operators, and delimiters. Unrecognized characters are reported as errors without halting the scan.
2. **Syntax Analysis** (`Parser.ts`) — a hand-written recursive-descent parser with operator-precedence climbing (`comparison → addition → term → factor`). It builds a typed Abstract Syntax Tree (AST) and recovers from errors by synchronizing to the next statement boundary.
3. **Target Code Generation** (`Generator.ts`) — traverses the AST and emits executable JavaScript, including the infinite-loop guard for `while` statements.

All three phases are orchestrated through a single entry point, `index.ts`, which exposes a `compileCode(sourceCode: string)` function returning the generated code (or `null` on error), the full list of diagnostics, and the AST.

## Language Grammar (BNF)

```
program       ::= { statement }*
statement     ::= declaration | assignment | display_stmt | if_stmt | while_stmt
declaration   ::= ('patient' | 'measure') IDENTIFIER '=' expression ';'
assignment    ::= 'calculate' IDENTIFIER '=' expression ';'
display_stmt  ::= 'display' expression ';'
if_stmt       ::= 'if' expression statement
while_stmt    ::= 'while' expression statement

expression    ::= comparison
comparison    ::= addition ( ('>' | '<' | '==') addition )*
addition      ::= term ( ('+' | '-') term )*
term          ::= factor ( ('*' | '/') factor )*
factor        ::= '(' expression ')' | NUMBER | STRING | IDENTIFIER
```

## Example Programs

**Vital signs monitor with a conditional warning:**
```
measure heartRate = 105;
measure systolic = 140;
display "Heart Rate:";
display heartRate;
display "Systolic BP:";
display systolic;
if heartRate > 100
  display "WARNING: Elevated Heart Rate Detected";
```

**Iterative dosage calculator:**
```
patient dose = 1;
calculate total = 0;
while dose < 6
  calculate total = total + dose;
display "Total cumulative dose:";
display total;
```

## Project Structure

```
src/
├── compiler/
│   ├── Lexer.ts       # Phase 1: tokenization
│   ├── Parser.ts      # Phase 2: AST construction
│   ├── Generator.ts   # Phase 3: JavaScript code generation
│   └── index.ts        # Pipeline orchestration (compileCode)
├── App.tsx             # React IDE: editor, diagnostics, AST viewer, vitals chart
├── App.css / index.css # Styling
└── main.tsx
```

## Getting Started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Known Limitations

- No semantic analysis phase (no symbol table, type-checking, or undeclared-variable detection)
- `if` and `while` support only a single statement as their body — no block syntax
- No `else` / `else-if` clause
- No intermediate representation (compiles directly from AST to JavaScript)
- No arrays or aggregate data types
- No user-defined functions/subprograms

## Possible Future Improvements

- Add a semantic analysis pass with a scoped symbol table and type checking
- Support `{ }` block bodies for `if`/`while`, plus `else` clauses
- Introduce a Three-Address Code (TAC) intermediate representation to enable optimization passes
- Add array/list types for time-series vital sign data
- Add functions/subprograms with parameter passing
