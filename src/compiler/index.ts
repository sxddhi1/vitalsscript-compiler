import { Lexer } from "./Lexer";
import type { CompilerError } from "./Lexer";
import { Parser } from "./Parser";
import type { Stmt } from "./Parser";
import { Generator } from "./Generator";

export interface CompilerResult {
  targetCode: string | null;
  errors: CompilerError[];
  ast: Stmt[] | null;
}

export function compileCode(sourceCode: string): CompilerResult {
  // Phase 1: Lexical Analysis
  const lexer = new Lexer(sourceCode);
  const { tokens, errors: lexerErrors } = lexer.scanTokens();

  // Phase 2: Syntax Analysis (Parsing)
  const parser = new Parser(tokens, lexerErrors);
  const ast = parser.parse();
  
  // Collect all errors from both phases
  const allErrors = parser.errors;

  // Phase 3: Target Code Generation (STRICT RULE: Only if zero errors)
  let targetCode = null;
  if (allErrors.length === 0) {
    const generator = new Generator();
    targetCode = generator.generate(ast);
  }

  return {
    targetCode,
    errors: allErrors,
    ast,
  };
}