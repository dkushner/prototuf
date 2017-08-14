import Lexer, { SyntaxTarget } from './lexer';
import { Node, Identifier, SyntaxDeclaration, SourceFile, SyntaxType, Token } from './language';

const enum ParsingContext {
    SourceElements,
    MessageMembers,
    EnumMembers
}


export default class Parser {
    private lexer: Lexer;
    private currentToken: SyntaxType;
    private context: ParsingContext;
    private nodeCount: number;

    constructor(fileName: string, sourceText: string) {
        this.lexer = new Lexer(SyntaxTarget.PROTO3, true);
        this.lexer.setText(sourceText, 0, sourceText.length);
        this.nodeCount = 0;
    }

    public token(): SyntaxType {
        return this.currentToken;
    }

    public nextToken(): SyntaxType {
        return this.currentToken = this.lexer.scan();
    }

    private lexerError(message: string): void {
        console.error(message);
    }

    public parse(): SourceFile {
        const sourceFile = <SourceFile>this.createNode(SyntaxType.SourceFile, 0);
        this.context = ParsingContext.SourceElements;

        this.nextToken();
        sourceFile.syntax = this.parseSyntaxDeclaration();

        this.finishNode(sourceFile);
        return sourceFile;
    }

    public tryParse<T>(callback: () => T): T {
        return this.stateGuard(callback, false);
    }

    public lookAhead<T>(callback: () => T): T {
        return this.stateGuard(callback, true);
    }

    private stateGuard<T>(callback: () => T, restore: boolean): T {
        const currentToken = this.currentToken;
        const context = this.context;

        const result = restore ? this.lexer.lookAhead(callback) : this.lexer.tryScan(callback);

        if (!result || restore) {
            this.currentToken = currentToken;
            this.context = context;
        }

        return result;
    }

    private parseExpected(kind: SyntaxType, advance = true): boolean {
        console.log(this.token());
        if (this.token() === kind) {
            if (advance) {
                this.nextToken();
            }
            return true;
        }
        return false;
    }

    private parseSyntaxDeclaration(): SyntaxDeclaration {
        const syntaxStatement = <SyntaxDeclaration>this.createNode(SyntaxType.SyntaxDeclaration, this.lexer.getTextPosition());
        this.parseExpected(SyntaxType.SyntaxKeyword);
        this.parseExpected(SyntaxType.EqualsToken);


        if (this.token() === SyntaxType.StringLiteral) {
            const syntax = this.lexer.getTokenValue();
            switch (syntax) {
                case 'proto3': {
                    syntaxStatement.version = 3;
                } break;
                case 'proto2': {
                    syntaxStatement.version = 2;
                } break;
                default: {
                    throw new Error(`unrecogninzed syntax mode '${syntax}'`);
                }
            }
        } else {
            throw new Error(`expected valid syntax mode string`);
        }

        this.parseExpected(SyntaxType.SemicolonToken);
        return this.finishNode(syntaxStatement);
    }

    private createNode<Kind extends SyntaxType>(kind: SyntaxType, position?: number): Node | Token<Kind> | Identifier {
        if (position < 0) {
            position = this.lexer.getStartPosition();
        }

        return this.isNode(kind) ? <Node>{ kind, start: position, end: position } :
            (kind === SyntaxType.Identifier) ? <Identifier>{ kind, start: position, end: position } :
            <Token<Kind>>{ kind, start: position, end: position };
    }

    private isNode(kind: SyntaxType): boolean {
        return kind >= SyntaxType.FirstNode && kind <= SyntaxType.LastNode;
    }

    private finishNode<T extends Node>(node: T, end?: number): T {
        node.end = (end === undefined) ? this.lexer.getStartPosition() : end;
        return node;
    }
}