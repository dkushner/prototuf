import Lexer, { SyntaxTarget } from './lexer';
import { Node, Statement, Identifier, SyntaxStatement, SourceFile, SyntaxType, Token } from './language';
import { EmptyStatement, EnumDeclaration, MessageDeclaration, OptionStatement } from './language';

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

    constructor(sourceText: string) {
        this.lexer = new Lexer(SyntaxTarget.PROTO3, true);
        this.lexer.setText(sourceText, 0, sourceText.length);

        this.nodeCount = 0;

        // Prime the parser.
        this.nextToken();
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

    public parseSourceFile(fileName: string): SourceFile {
        const sourceFile = <SourceFile>this.createNode(SyntaxType.SourceFile, 0);
        this.context = ParsingContext.SourceElements;

        sourceFile.fileName = fileName;

        // The first statement must always be a syntax declaration.
        sourceFile.syntax = this.parseSyntaxDeclaration();
        this.nextToken();

        while (this.token() !== SyntaxType.EndOfFileToken) {
            const statement = this.parseStatement();
        }

        this.finishNode(sourceFile);
        return sourceFile;
    }

    public tryParse<T>(callback: () => T): T {
        return this.stateGuard(callback, false);
    }

    public lookAhead<T>(callback: () => T): T {
        return this.stateGuard(callback, true);
    }

    private parseStatement(): Statement {
        switch (this.token()) {
            case SyntaxType.OptionKeyword:
                return this.parseOptionStatement();
            case SyntaxType.PackageKeyword:
                return this.parsePackageDeclaration();
            case SyntaxType.MessageKeyword:
                return this.parseMessageDeclaration();
            case SyntaxType.EnumKeyword:
                return this.parseEnumDeclaration();
            case SyntaxType.SemicolonToken:
                return this.parseEmptyStatement();
            default:
                throw new Error(`unexpected token ${this.token()} while parsing statements`);
        }
    }

    private parseEnumDeclaration(): EnumDeclaration {
        const enumDeclaration = <EnumDeclaration>this.createNode(SyntaxType.EnumDeclaration, this.lexer.getStartPosition());
        this.finishNode(enumDeclaration, this.lexer.getTextPosition());
        return enumDeclaration;

    }

    private parseOptionStatement(): OptionStatement {
        const optionStatement = <OptionStatement>this.createNode(SyntaxType.OptionStatement, this.lexer.getStartPosition());
        this.finishNode(optionStatement, this.lexer.getTextPosition());
        return optionStatement;
    }

    private parseMessageDeclaration(): MessageDeclaration {
        const messageDeclaration = <MessageDeclaration>this.createNode(SyntaxType.MessageDeclaration, this.lexer.getStartPosition());
        this.finishNode(messageDeclaration, this.lexer.getTextPosition());
        return messageDeclaration;
    }

    private parsePackageDeclaration(): PackageDeclaration {

    }

    private parseEmptyStatement(): EmptyStatement {
        const emptyStatement = <EmptyStatement>this.createNode(SyntaxType.EmptyStatement, this.lexer.getTextPosition());
        this.parseExpected(SyntaxType.SemicolonToken);
        this.finishNode(emptyStatement, this.lexer.getTextPosition());
        return emptyStatement;
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
        if (this.token() === kind) {
            if (advance) {
                this.nextToken();
            }
            return true;
        }

        throw new Error(`unexpected token ${this.token()}, expected ${kind}`);
        // return false;
    }

    private parseSyntaxDeclaration(): SyntaxStatement {
        const syntaxStatement = <SyntaxStatement>this.createNode(SyntaxType.SyntaxStatement, this.lexer.getTokenPosition());
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

        this.nextToken();
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