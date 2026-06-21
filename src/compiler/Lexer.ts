// Define our token types
export const TokenType = {
  PATIENT: "PATIENT",
  MEASURE: "MEASURE",
  CALCULATE: "CALCULATE",
  DISPLAY: "DISPLAY",
  IDENTIFIER: "IDENTIFIER",
  NUMBER: "NUMBER",
  ASSIGN: "ASSIGN", // =
  PLUS: "PLUS", // +
  MINUS: "MINUS", // -
  MULTIPLY: "MULTIPLY", // *
  DIVIDE: "DIVIDE", // /
  SEMICOLON: "SEMICOLON", // ;
  IF: "IF",
  WHILE: "WHILE",
  STRING: "STRING",
  GREATER: "GREATER", // >
  LESS: "LESS", // <
  EQUAL_EQUAL: "EQUAL_EQUAL", // ==
  LEFT_PAREN: "LEFT_PAREN", // (
  RIGHT_PAREN: "RIGHT_PAREN", // )
  EOF: "EOF",
  ERROR: "ERROR",
} as const;

export type TokenType = (typeof TokenType)[keyof typeof TokenType];
  
  export interface Token {
    type: TokenType;
    lexeme: string;
    line: number;
  }
  
  export interface CompilerError {
    line: number;
    message: string;
  }
  
  export class Lexer {
    private source: string;
    private tokens: Token[] = [];
    public errors: CompilerError[] = [];
    
    private start: number = 0;
    private current: number = 0;
    private line: number = 1;
  
    // Reserved keywords for VitalsScript
    private keywords: Record<string, TokenType> = {
      patient: TokenType.PATIENT,
      measure: TokenType.MEASURE,
      calculate: TokenType.CALCULATE,
      display: TokenType.DISPLAY,
      if: TokenType.IF,
      while: TokenType.WHILE,
    };
  
    constructor(source: string) {
      this.source = source;
    }
  
    public scanTokens(): { tokens: Token[]; errors: CompilerError[] } {
      while (!this.isAtEnd()) {
        this.start = this.current;
        this.scanToken();
      }
  
      this.tokens.push({ type: TokenType.EOF, lexeme: "", line: this.line });
      return { tokens: this.tokens, errors: this.errors };
    }
  
    private scanToken(): void {
      const c = this.advance();
      switch (c) {
        case "=":
          this.addToken(this.match("=") ? TokenType.EQUAL_EQUAL : TokenType.ASSIGN);
          break;
        case ">":
          this.addToken(TokenType.GREATER);
          break;
        case "<":
          this.addToken(TokenType.LESS);
          break;
        case "+": this.addToken(TokenType.PLUS); break;
        case "-": this.addToken(TokenType.MINUS); break;
        case "*": this.addToken(TokenType.MULTIPLY); break;
        case "/": this.addToken(TokenType.DIVIDE); break;
        case ";": this.addToken(TokenType.SEMICOLON); break;
        case " ":
        case "\r":
        case "\t":
          // Ignore whitespace
          break;
        case "\n":
          this.line++;
          break;
        case '"':
          this.string();
          break;
        case "(":
          this.addToken(TokenType.LEFT_PAREN);
          break;
        case ")":
          this.addToken(TokenType.RIGHT_PAREN);
          break;
        default:
          if (this.isDigit(c)) {
            this.number();
          } else if (this.isAlpha(c)) {
            this.identifier();
          } else {
            // If we hit an unrecognized character, log an error but CONTINUE analyzing 
            this.errors.push({
              line: this.line,
              message: `Lexical Error: Unexpected character '${c}'`,
            });
          }
          break;
      }
    }
  
    private string(): void {
      while (this.peek() !== '"' && !this.isAtEnd()) {
        if (this.peek() === '\n') this.line++;
        this.advance();
      }

      if (this.isAtEnd()) {
        this.errors.push({
          line: this.line,
          message: "Lexical Error: Unterminated string.",
        });
        return;
      }

      // The closing "
      this.advance();
      this.addToken(TokenType.STRING);
    }

    private identifier(): void {
      while (this.isAlphaNumeric(this.peek())) this.advance();
  
      const text = this.source.substring(this.start, this.current);
      let type = this.keywords[text];
      if (!type) type = TokenType.IDENTIFIER;
      
      this.addToken(type);
    }
  
    private number(): void {
      while (this.isDigit(this.peek())) this.advance();
  
      // Look for a fractional part
      if (this.peek() === "." && this.isDigit(this.peekNext())) {
        this.advance(); // Consume the "."
        while (this.isDigit(this.peek())) this.advance();
      }
  
      this.addToken(TokenType.NUMBER);
    }
  
    private advance(): string {
      return this.source.charAt(this.current++);
    }

    private match(expected: string): boolean {
      if (this.isAtEnd()) return false;
      if (this.source.charAt(this.current) !== expected) return false;
      this.current++;
      return true;
    }
  
    private addToken(type: TokenType): void {
      const text = this.source.substring(this.start, this.current);
      this.tokens.push({ type, lexeme: text, line: this.line });
    }
  
    private isAtEnd(): boolean {
      return this.current >= this.source.length;
    }
  
    private peek(): string {
      if (this.isAtEnd()) return "\0";
      return this.source.charAt(this.current);
    }
  
    private peekNext(): string {
      if (this.current + 1 >= this.source.length) return "\0";
      return this.source.charAt(this.current + 1);
    }
  
    private isDigit(c: string): boolean {
      return c >= "0" && c <= "9";
    }
  
    private isAlpha(c: string): boolean {
      return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
    }
  
    private isAlphaNumeric(c: string): boolean {
      return this.isAlpha(c) || this.isDigit(c);
    }
  }