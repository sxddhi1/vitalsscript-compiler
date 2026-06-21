import { TokenType } from "./Lexer";
import type { Token, CompilerError } from "./Lexer";

// --- AST (Abstract Syntax Tree) Nodes ---
export type Expr =
  | { type: "Binary"; left: Expr; operator: Token; right: Expr }
  | { type: "Literal"; value: string }
  | { type: "Variable"; name: Token }
  | { type: "Grouping"; expression: Expr };

export type Stmt =
  | { type: "Declaration"; keyword: Token; name: Token; value: Expr }
  | { type: "Assignment"; keyword: Token; name: Token; value: Expr }
  | { type: "Display"; value: Expr }
  | { type: "If"; condition: Expr; thenBranch: Stmt }
  | { type: "While"; condition: Expr; body: Stmt };

export class Parser {
  private tokens: Token[];
  private current = 0;
  public errors: CompilerError[] = [];

  constructor(tokens: Token[], lexerErrors: CompilerError[]) {
    this.tokens = tokens;
    // We bring over any errors the Lexer found so everything stays in one list
    this.errors = [...lexerErrors]; 
  }

  public parse(): Stmt[] {
    const statements: Stmt[] = [];
    while (!this.isAtEnd()) {
      try {
        const stmt = this.declaration();
        if (stmt) statements.push(stmt);
      } catch {
        // This fulfills the assignment requirement: catch the error and keep going
        this.synchronize(); 
      }
    }
    return statements;
  }

  private declaration(): Stmt | null {
    if (this.match(TokenType.PATIENT, TokenType.MEASURE)) {
      const keyword = this.previous();
      const name = this.consume(TokenType.IDENTIFIER, "Expected variable name.");
      this.consume(TokenType.ASSIGN, "Expected '=' after variable name.");
      
      const nextType = this.peek().type;
      if (nextType === TokenType.SEMICOLON || nextType === TokenType.PATIENT || nextType === TokenType.MEASURE || nextType === TokenType.CALCULATE || nextType === TokenType.DISPLAY || nextType === TokenType.IF || nextType === TokenType.WHILE || nextType === TokenType.EOF) {
        this.error(this.peek(), "Expected expression after '='.");
        throw new Error("Parse Error");
      }

      const value = this.expression();
      this.consume(TokenType.SEMICOLON, "Expected ';' after declaration.");
      return { type: "Declaration", keyword, name, value };
    }

    if (this.match(TokenType.CALCULATE)) {
      const keyword = this.previous();
      const name = this.consume(TokenType.IDENTIFIER, "Expected variable name.");
      this.consume(TokenType.ASSIGN, "Expected '=' after variable name.");
      
      const nextType = this.peek().type;
      if (nextType === TokenType.SEMICOLON || nextType === TokenType.PATIENT || nextType === TokenType.MEASURE || nextType === TokenType.CALCULATE || nextType === TokenType.DISPLAY || nextType === TokenType.IF || nextType === TokenType.WHILE || nextType === TokenType.EOF) {
        this.error(this.peek(), "Expected expression after '='.");
        throw new Error("Parse Error");
      }

      const value = this.expression();
      this.consume(TokenType.SEMICOLON, "Expected ';' after assignment.");
      return { type: "Assignment", keyword, name, value };
    }

    if (this.match(TokenType.DISPLAY)) {
      const value = this.expression();
      this.consume(TokenType.SEMICOLON, "Expected ';' after display statement.");
      return { type: "Display", value };
    }

    if (this.match(TokenType.IF)) {
      const condition = this.expression();
      const thenBranch = this.declaration();
      if (!thenBranch) throw new Error("Parse Error");
      return { type: "If", condition, thenBranch };
    }

    if (this.match(TokenType.WHILE)) {
      const condition = this.expression();
      const body = this.declaration();
      if (!body) throw new Error("Parse Error");
      return { type: "While", condition, body };
    }

    this.error(this.peek(), "Unrecognized statement.");
    throw new Error("Parse Error");
  }

  private expression(): Expr {
    return this.comparison();
  }

  private comparison(): Expr {
    let expr = this.addition();

    while (this.match(TokenType.GREATER, TokenType.LESS, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.addition();
      expr = { type: "Binary", left: expr, operator, right };
    }

    return expr;
  }

  private addition(): Expr {
    let expr = this.term();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.term();
      expr = { type: "Binary", left: expr, operator, right };
    }

    return expr;
  }

  private term(): Expr {
    let expr = this.factor();

    while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE)) {
      const operator = this.previous();
      const right = this.factor();
      expr = { type: "Binary", left: expr, operator, right };
    }

    return expr;
  }

  private factor(): Expr {
    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expected ')' after expression.");
      return { type: "Grouping", expression: expr };
    }
    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return { type: "Literal", value: this.previous().lexeme };
    }
    if (this.match(TokenType.IDENTIFIER)) {
      return { type: "Variable", name: this.previous() };
    }

    this.error(this.peek(), "Expected a number or variable.");
    throw new Error("Parse Error");
  }

  // --- Helper Methods ---
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    this.error(this.peek(), message);
    throw new Error("Parse Error");
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private error(token: Token, message: string): void {
    this.errors.push({
      line: token.line,
      message: `Syntax Error at '${token.lexeme}': ${message}`,
    });
  }

  // The crucial recovery mechanism
  private synchronize(): void {
    if (this.isAtEnd()) return;
    
    // Do not consume the token if we are already sitting cleanly at a boundary keyword!
    const currentType = this.peek().type;
    if (currentType === TokenType.PATIENT || currentType === TokenType.MEASURE || currentType === TokenType.CALCULATE || currentType === TokenType.DISPLAY || currentType === TokenType.IF || currentType === TokenType.WHILE) {
      return; 
    }

    this.advance();
    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;
      switch (this.peek().type) {
        case TokenType.PATIENT:
        case TokenType.MEASURE:
        case TokenType.CALCULATE:
        case TokenType.DISPLAY:
        case TokenType.IF:
        case TokenType.WHILE:
          return;
      }
      this.advance();
    }
  }
}