import type { Expr, Stmt } from "./Parser";

export class Generator {
  public generate(statements: Stmt[]): string {
    let output = "";
    for (const stmt of statements) {
      output += this.generateStatement(stmt) + "\n";
    }
    return output;
  }

  private generateStatement(stmt: Stmt): string {
    switch (stmt.type) {
      case "Declaration":
        return `let ${stmt.name.lexeme} = ${this.generateExpression(stmt.value)};`;
      case "Assignment":
        return `${stmt.name.lexeme} = ${this.generateExpression(stmt.value)};`;
      case "Display":
        return `printOutput(${this.generateExpression(stmt.value)});`;
      case "If":
        return `if (${this.generateExpression(stmt.condition)}) {\n  ${this.generateStatement(stmt.thenBranch)}\n}`;
      case "While":
        const limit = `__it_${Math.floor(Math.random() * 100000)}`;
        return `let ${limit} = 0;\nwhile (${this.generateExpression(stmt.condition)}) {\n  if (${limit}++ > 1000) { printOutput("[ERROR: Infinite Loop Detected]"); break; }\n  ${this.generateStatement(stmt.body)}\n}`;
      default:
        return "";
    }
  }

  private generateExpression(expr: Expr): string {
    switch (expr.type) {
      case "Literal":
        return expr.value;
      case "Variable":
        return expr.name.lexeme;
      case "Grouping":
        return `(${this.generateExpression(expr.expression)})`;
      case "Binary":
        return `${this.generateExpression(expr.left)} ${expr.operator.lexeme} ${this.generateExpression(expr.right)}`;
      default:
        return "";
    }
  }
}