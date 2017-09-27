import { Lexer } from './lexer';
import { SyntaxType, SyntaxTarget } from './language';
import { Node, NodeArray, Statement, EmptyStatement, Modifier, Literal, Token, Identifier, FullIdentifier } from './language';
import { Type, TypeReference, KnownType, Constant } from './language';
import { SourceFile, SourceFileStatement } from './language';
import { ServiceDefinition, ServiceName, ServiceBodyStatement } from './language';
import { RPCStatement, RPCName, RPCBodyStatement } from './language';
import { MessageDefinition, MessageName, MessageBodyStatement } from './language';
import { ImportStatement, SyntaxStatement, OptionStatement, PackageStatement } from './language';
import { StringLiteral, DecimalLiteral, OctalLiteral, FloatLiteral, IntegerLiteral, HexLiteral, BooleanLiteral } from './language';
import { MapFieldStatement, OneofStatement, OneofName, OneofFieldStatement } from './language';
import { EnumDefinition, EnumName, EnumFieldStatement, EnumBodyStatement } from './language';
import { FieldStatement, FieldName } from './language';

import { isKeyType, isIntegerLiteral, isKnownType } from './utils';

const enum ParsingContext {
    SourceElements,
    MessageMembers,
    EnumMembers
}

/**
 * Implements a Protobuf parser.
 * Note that if you are implementing a parser function, you must advance the cursor after
 * you have completed parsing your node by calling either parseExpected or nextToken.
 */
export class Parser {
    private lexer: Lexer;
    private currentToken: SyntaxType;
    private context: ParsingContext;
    private nodeCount: number;
    private identifierCount: number;

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

        const statements: SourceFileStatement[] = [];
        while (this.token() !== SyntaxType.EndOfFileToken) {
            const statement = <SourceFileStatement>this.parseSourceFileStatement();
            statements.push(statement);
        }

        sourceFile.statements = this.createNodeArray(statements);
        sourceFile.nodeCount = this.nodeCount;

        this.finishNode(sourceFile);
        return sourceFile;
    }

    private parseSourceFileStatement(): SourceFileStatement {
        switch (this.token()) {
            case SyntaxType.OptionKeyword:
                return this.parseOptionStatement();
            case SyntaxType.PackageKeyword:
                return this.parsePackageStatement();
            case SyntaxType.ImportKeyword:
                return this.parseImportStatement();
            case SyntaxType.MessageKeyword:
                return this.parseMessageDefinition();
            case SyntaxType.EnumKeyword:
                return this.parseEnumDefinition();
            case SyntaxType.SemicolonToken:
                return this.parseEmptyStatement();
            case SyntaxType.ServiceKeyword:
                return this.parseServiceDefinition();
            default:
                throw new Error(`unexpected token (${this.lexer.getTokenText()}, ${this.token()}) while parsing statements`);
        }
    }

    private parseMessageBodyStatement(): Statement {
        switch (this.token()) {
            case SyntaxType.OptionKeyword:
                return this.parseOptionStatement();
            case SyntaxType.EnumKeyword:
                return this.parseEnumDefinition();
            case SyntaxType.MessageKeyword:
                return this.parseMessageDefinition();
            case SyntaxType.RepeatedKeyword:
            case SyntaxType.Identifier:
            case SyntaxType.DotToken:
            case SyntaxType.DoubleKeyword:
            case SyntaxType.FloatKeyword:
            case SyntaxType.Int32Keyword:
            case SyntaxType.Int64Keyword:
            case SyntaxType.Uint32Keyword:
            case SyntaxType.Uint64Keyword:
            case SyntaxType.Sint32Keyword:
            case SyntaxType.Sint64Keyword:
            case SyntaxType.Fixed32Keyword:
            case SyntaxType.Fixed64Keyword:
            case SyntaxType.Sfixed32Keyword:
            case SyntaxType.Sfixed64Keyword:
            case SyntaxType.BoolKeyword:
            case SyntaxType.StringKeyword:
            case SyntaxType.BytesKeyword:
                return this.parseFieldStatement();
            case SyntaxType.OneofKeyword:
                return this.parseOneofStatement();
            case SyntaxType.MapKeyword:
                return this.parseMapFieldStatement();
            case SyntaxType.SemicolonToken:
                return this.parseEmptyStatement();
            default:
                throw new Error(`expected start of message body statement but got ${this.token()}`);
        }
    }

    private parseServiceBodyStatement(): ServiceBodyStatement {
        switch (this.token()) {
            case SyntaxType.OptionKeyword:
                return this.parseOptionStatement();
            case SyntaxType.SemicolonToken:
                return this.parseEmptyStatement();
            case SyntaxType.RPCKeyword:
                return this.parseRPCStatement();
            default:
                throw new Error(`expected start of service body statement but got ${this.token()}`);
        }
    }

    private parseRPCBodyStatement(): RPCBodyStatement {
        switch (this.token()) {
            case SyntaxType.OptionKeyword:
                return this.parseOptionStatement();
            case SyntaxType.SemicolonToken:
                return this.parseEmptyStatement();
            default:
                throw new Error(`expected start of RPC body statement but got ${this.token()}`);
        }
    }

    private parseRPCStatement(): RPCStatement {
        const rpcStatement = <RPCStatement>this.createNode(SyntaxType.RPCStatement, this.lexer.getTokenPosition());
        this.parseExpected(SyntaxType.RPCKeyword);

        rpcStatement.name = <RPCName>this.parseIdentifier();

        this.parseExpected(SyntaxType.OpenParenToken);
        if (this.token() === SyntaxType.StreamKeyword) {
            const modifier = <Modifier>this.createNode(SyntaxType.StreamKeyword, this.lexer.getTokenPosition());
            this.parseExpected(SyntaxType.StreamKeyword);
            this.finishNode(modifier);

            const sendType = <TypeReference>this.parseFullIdentifier();
            sendType.modifiers = this.createNodeArray([modifier]);

            rpcStatement.sendType = sendType;
        } else {
            rpcStatement.sendType = <TypeReference>this.parseFullIdentifier();
        }
        this.parseExpected(SyntaxType.CloseParenToken);

        this.parseExpected(SyntaxType.ReturnsKeyword);

        this.parseExpected(SyntaxType.OpenParenToken);
        if (this.token() === SyntaxType.StreamKeyword) {
            const modifier = <Modifier>this.createNode(SyntaxType.StreamKeyword, this.lexer.getTokenPosition());
            this.parseExpected(SyntaxType.StreamKeyword);
            this.finishNode(modifier);

            const receiveType = <TypeReference>this.parseFullIdentifier();
            receiveType.modifiers = this.createNodeArray([modifier]);

            rpcStatement.receiveType = receiveType;
        } else {
            rpcStatement.receiveType = <TypeReference>this.parseFullIdentifier();
        }
        this.parseExpected(SyntaxType.CloseParenToken);

        if (this.token() === SyntaxType.OpenBraceToken) {
            this.parseExpected(SyntaxType.OpenBraceToken);
            const statements = [];
            while (this.token() !== SyntaxType.CloseBraceToken) {
                const statement = this.parseRPCBodyStatement();
                statements.push(<RPCBodyStatement>statement);
            }
            rpcStatement.body = this.createNodeArray(statements);
            this.parseExpected(SyntaxType.CloseBraceToken);
        } else {
            this.parseExpected(SyntaxType.SemicolonToken);
        }

        this.finishNode(rpcStatement);
        return rpcStatement;
    }

    private parseServiceDefinition(): ServiceDefinition {
        const serviceDefinition = <ServiceDefinition>this.createNode(SyntaxType.ServiceDefinition, this.lexer.getTokenPosition());
        this.parseExpected(SyntaxType.ServiceKeyword);

        serviceDefinition.name = <ServiceName>this.parseIdentifier();
        this.parseExpected(SyntaxType.OpenBraceToken);

        const statements = [];
        while (this.token() !== SyntaxType.CloseBraceToken) {
            const statement = this.parseServiceBodyStatement();
            statements.push(<ServiceBodyStatement>statement);
        }
        this.parseExpected(SyntaxType.CloseBraceToken);

        serviceDefinition.body = this.createNodeArray(statements);

        this.finishNode(serviceDefinition);
        return serviceDefinition;
    }

    private parseImportStatement(): ImportStatement {
        const importStatement = <ImportStatement>this.createNode(SyntaxType.ImportStatement, this.lexer.getTokenPosition());

        this.parseExpected(SyntaxType.ImportKeyword);
        if (this.token() === SyntaxType.WeakKeyword || this.token() === SyntaxType.PublicKeyword) {
            const modifier = <Modifier>this.createNode(this.token(), this.lexer.getTokenPosition());
            this.parseExpected(this.token());
            this.finishNode(modifier);

            importStatement.modifiers = this.createNodeArray([modifier]);
        }

        const filePath = this.parseLiteral();
        if (filePath.kind !== SyntaxType.StringLiteral) {
            throw new Error(`expected string literal file path but got ${filePath.kind}`);
        }
        importStatement.file = <StringLiteral>filePath;
        this.parseExpected(SyntaxType.SemicolonToken);
        this.finishNode(importStatement);
        return importStatement;
    }

    private parseMapFieldStatement(): MapFieldStatement {
        const mapField = <MapFieldStatement>this.createNode(SyntaxType.MapFieldStatement, this.lexer.getTokenPosition());

        this.parseExpected(SyntaxType.MapKeyword);
        this.parseExpected(SyntaxType.LessThanToken);

        const type = this.parseKnownType();
        if (!isKeyType(type)) {
            throw new Error(`invalid key type ${type.kind} for map field`);
        }
        mapField.key = type;

        this.parseExpected(SyntaxType.CommaToken);
        if (this.token() === SyntaxType.Identifier || this.token() === SyntaxType.DotToken) {
            mapField.type = <TypeReference>this.parseFullIdentifier();
        } else {
            mapField.type = <KnownType>this.parseKnownType();
        }

        this.parseExpected(SyntaxType.GreaterThanToken);

        mapField.name = <FieldName>this.parseIdentifier();
        this.parseExpected(SyntaxType.EqualsToken);

        const fieldNumber = this.parseLiteral();
        if (!isIntegerLiteral(fieldNumber)) {
            throw new Error(`invalid field number type ${fieldNumber.kind}`);
        }
        mapField.number = fieldNumber;
        this.parseExpected(SyntaxType.SemicolonToken);

        this.finishNode(mapField);
        return mapField;
    }

    private parseEnumBodyStatement(): Statement {
        switch (this.token()) {
            case SyntaxType.OptionKeyword:
                return this.parseOptionStatement();
            case SyntaxType.Identifier:
                return this.parseEnumFieldStatement();
            case SyntaxType.SemicolonToken:
                return this.parseEmptyStatement();
            default:
                throw new Error(`expected start of enum body statement but got ${this.token()}`);
        }
    }

    private parseEnumFieldStatement(): EnumFieldStatement {
        const enumFieldStatement = <EnumFieldStatement>this.createNode(SyntaxType.FieldStatement, this.lexer.getTokenPosition());

        enumFieldStatement.name = this.parseIdentifier();
        this.parseExpected(SyntaxType.EqualsToken);

        const value = this.parseLiteral();
        if (!isIntegerLiteral(value)) {
            throw new Error(`enum field number must be an integer value`);
        }
        enumFieldStatement.number = value as IntegerLiteral;

        this.parseExpected(SyntaxType.SemicolonToken);

        this.finishNode(enumFieldStatement);
        return enumFieldStatement;
    }

    private parseFieldStatement(): FieldStatement {
        const fieldStatement = <FieldStatement>this.createNode(SyntaxType.FieldStatement, this.lexer.getTokenPosition());

        if (this.token() === SyntaxType.RepeatedKeyword) {
            const modifier = <Modifier>this.createNode(SyntaxType.RepeatedKeyword, this.lexer.getTokenPosition());
            this.parseExpected(SyntaxType.RepeatedKeyword);
            this.finishNode(modifier);
            fieldStatement.modifiers = this.createNodeArray([modifier]);
        }

        if (this.token() === SyntaxType.Identifier || this.token() === SyntaxType.DotToken) {
            fieldStatement.type = <TypeReference>this.parseFullIdentifier();
        } else {
            fieldStatement.type = <KnownType>this.parseKnownType();
        }

        fieldStatement.name = <FieldName>this.parseIdentifier();

        this.parseExpected(SyntaxType.EqualsToken);

        const fieldNumber = this.parseLiteral();

        if (!isIntegerLiteral(fieldNumber)) {
            throw new Error(`invalid field number type ${fieldNumber.kind}`);
        }

        fieldStatement.number = fieldNumber;
        this.parseExpected(SyntaxType.SemicolonToken);
        this.finishNode(fieldStatement);
        return fieldStatement;
    }

    private parseKnownType(): KnownType {
        const knownType = <KnownType>this.createNode(this.token(), this.lexer.getTokenPosition());
        if (!isKnownType(knownType)) {
            throw new Error(`expected known type but got ${this.token()}`);
        }

        this.nextToken();
        this.finishNode(knownType);
        return knownType;
    }

    private parsePackageStatement(): PackageStatement {
        const packageStatement = <PackageStatement>this.createNode(SyntaxType.PackageStatement, this.lexer.getStartPosition());
        this.parseExpected(SyntaxType.PackageKeyword);

        packageStatement.name = this.parseFullIdentifier();
        this.parseExpected(SyntaxType.SemicolonToken);

        this.finishNode(packageStatement);
        return packageStatement;
    }

    private parseFullIdentifier(): FullIdentifier {
        const fullIdentifier = <FullIdentifier>this.createNode(SyntaxType.FullIdentifier, this.lexer.getStartPosition());

        if (this.token() === SyntaxType.DotToken) {
            const modifier = <Modifier>this.createNode(SyntaxType.DotToken, this.lexer.getTokenPosition());
            this.parseExpected(SyntaxType.DotToken);
            this.finishNode(modifier);
            fullIdentifier.modifiers = this.createNodeArray([modifier]);
        }

        const qualifiers = [];
        let current: Identifier;
        while (this.token() === SyntaxType.Identifier || this.lexer.isReservedWord()) {
            current = this.parseIdentifier();

            if (this.token() == SyntaxType.DotToken) {
                this.parseExpected(SyntaxType.DotToken);
                qualifiers.push(current);
            } else {
                break;
            }
        }

        fullIdentifier.qualifiers = this.createNodeArray(qualifiers);
        fullIdentifier.terminal = current;

        this.finishNode(fullIdentifier);
        return fullIdentifier;
    }

    private parseIdentifier(): Identifier {
        const identifier = <Identifier>this.createNode(SyntaxType.Identifier, this.lexer.getTokenPosition());
        // If we are expecting to parse an identifier, reserved words are perfectly valid.
        if (this.token() !== SyntaxType.Identifier && !this.lexer.isReservedWord()) {
            throw new Error(`expected identifier but received ${this.token()}`);
        }

        identifier.text = this.lexer.getTokenText();
        this.finishNode(identifier);
        this.nextToken();

        this.identifierCount++;
        return identifier;
    }

    private parseOneofStatement(): OneofStatement {
        const oneofStatement = <OneofStatement>this.createNode(SyntaxType.OneofStatement, this.lexer.getTokenPosition());

        this.parseExpected(SyntaxType.OneofKeyword);
        oneofStatement.name = <OneofName>this.parseIdentifier();
        this.parseExpected(SyntaxType.OpenBraceToken);

        const statements = [];
        while (this.token() !== SyntaxType.CloseBraceToken) {
            const statement = this.parseOneofBodyStatement();
            statements.push(<OneofFieldStatement>statement);
        }
        this.parseExpected(SyntaxType.CloseBraceToken);

        oneofStatement.fields = this.createNodeArray(statements);

        this.finishNode(oneofStatement);
        return oneofStatement;
    }

    private parseOneofBodyStatement(): Statement {
        switch (this.token()) {
            case SyntaxType.SemicolonToken:
                return this.parseEmptyStatement();
            case SyntaxType.Identifier:
            case SyntaxType.DotToken:
            case SyntaxType.DoubleKeyword:
            case SyntaxType.FloatKeyword:
            case SyntaxType.Int32Keyword:
            case SyntaxType.Int64Keyword:
            case SyntaxType.Uint32Keyword:
            case SyntaxType.Uint64Keyword:
            case SyntaxType.Sint32Keyword:
            case SyntaxType.Sint64Keyword:
            case SyntaxType.Fixed32Keyword:
            case SyntaxType.Fixed64Keyword:
            case SyntaxType.Sfixed32Keyword:
            case SyntaxType.Sfixed64Keyword:
            case SyntaxType.BoolKeyword:
            case SyntaxType.StringKeyword:
            case SyntaxType.BytesKeyword:
                return this.parseFieldStatement();
            default:
                throw new Error(`expected oneof field statement but got ${this.token()}`);
        }
    }

    private parseEnumDefinition(): EnumDefinition {
        const enumDefinition = <EnumDefinition>this.createNode(SyntaxType.EnumDefinition, this.lexer.getTokenPosition());

        this.parseExpected(SyntaxType.EnumKeyword);
        enumDefinition.name = <EnumName>this.parseIdentifier();
        this.parseExpected(SyntaxType.OpenBraceToken);

        const statements = [];
        while (this.token() !== SyntaxType.CloseBraceToken) {
            const statement = this.parseEnumBodyStatement();
            statements.push(<EnumBodyStatement>statement);
        }
        this.parseExpected(SyntaxType.CloseBraceToken);

        enumDefinition.body = this.createNodeArray(statements);

        this.finishNode(enumDefinition);
        return enumDefinition;
    }

    private parseOptionStatement(): OptionStatement {
        const optionStatement = <OptionStatement>this.createNode(SyntaxType.OptionStatement, this.lexer.getTokenPosition());
        this.parseExpected(SyntaxType.OptionKeyword);

        // If option name includes an extension identifier, parse it.
        if (this.token() === SyntaxType.OpenParenToken) {
            this.parseExpected(SyntaxType.OpenParenToken);
            optionStatement.extension = this.parseFullIdentifier();
            this.parseExpected(SyntaxType.CloseParenToken);
        }

        // If we have a subsequent identifier after an extension, skip the joining
        // dot and parse the ident into the name field.
        if (optionStatement.extension && this.token() === SyntaxType.DotToken) {
            this.parseExpected(SyntaxType.DotToken);
        }
        optionStatement.name = this.parseFullIdentifier();

        this.parseExpected(SyntaxType.EqualsToken);

        optionStatement.value = this.parseConstant();

        this.parseExpected(SyntaxType.SemicolonToken);
        this.finishNode(optionStatement);
        return optionStatement;
    }

    private parseConstant(): Constant {
        // Check for sign modifier at lead of constant to signal numeric literal.
        let modifier: Modifier;
        if (this.token() === SyntaxType.PlusToken || this.token() === SyntaxType.MinusToken) {
            modifier = <Modifier>this.createNode(this.token(), this.lexer.getStartPosition());

            const valid = this.lookAhead(() => {
                const token = this.nextToken();
                return token === SyntaxType.FloatLiteral || token === SyntaxType.OctalLiteral ||
                    token === SyntaxType.HexLiteral || token === SyntaxType.DecimalLiteral;
            });

            if (!valid) {
                throw new Error(`invalid modifier '${this.lexer.getTokenText()} for non-numeric constant`);
            }

            this.finishNode(modifier, this.lexer.getTextPosition());
            this.nextToken();
        }

        let constant: Constant;
        switch (this.token()) {
            case SyntaxType.FloatLiteral:
            case SyntaxType.OctalLiteral:
            case SyntaxType.HexLiteral:
            case SyntaxType.DecimalLiteral:
            case SyntaxType.TrueKeyword:
            case SyntaxType.FalseKeyword:
            case SyntaxType.StringLiteral:
                constant = <Constant>this.parseLiteral();
                break;
            case SyntaxType.Identifier:
                constant = <Constant>this.parseFullIdentifier();
                break;
            default:
                throw new Error(`unexpected token ${this.token()} in constant expression`);
        }

        constant.modifiers = modifier ? this.createNodeArray([modifier]) : undefined;
        this.finishNode(constant);
        return constant;
    }

    private parseMessageDefinition(): MessageDefinition {
        const messageDefinition = <MessageDefinition>this.createNode(SyntaxType.MessageDefinition, this.lexer.getTokenPosition());

        this.parseExpected(SyntaxType.MessageKeyword);
        messageDefinition.name = <MessageName>this.parseIdentifier();
        this.parseExpected(SyntaxType.OpenBraceToken);

        const statements = [];
        while (this.token() !== SyntaxType.CloseBraceToken) {
            const statement = this.parseMessageBodyStatement();
            statements.push(<MessageBodyStatement>statement);
        }
        this.parseExpected(SyntaxType.CloseBraceToken);

        messageDefinition.body = this.createNodeArray(statements);

        this.finishNode(messageDefinition);
        return messageDefinition;
    }

    private parseEmptyStatement(): EmptyStatement {
        const emptyStatement = <EmptyStatement>this.createNode(SyntaxType.EmptyStatement, this.lexer.getStartPosition());
        this.parseExpected(SyntaxType.SemicolonToken);
        this.finishNode(emptyStatement);
        return emptyStatement;
    }

    private lookAhead<T>(callback: () => T): T {
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
        if (this.token() === kind) {
            if (advance) {
                this.nextToken();
            }
            return true;
        }

        throw new Error(`unexpected token ${this.token()}, expected ${kind}`);
        // return false;
    }

    private parseLiteral(): Literal {
        let literal: Literal;

        switch (this.token()) {
            case SyntaxType.StringLiteral:
                literal = <StringLiteral>this.createNode(SyntaxType.StringLiteral, this.lexer.getStartPosition());
                break;
            case SyntaxType.DecimalLiteral:
                literal = <DecimalLiteral>this.createNode(SyntaxType.DecimalLiteral, this.lexer.getStartPosition());
                break;
            case SyntaxType.OctalLiteral:
                literal = <OctalLiteral>this.createNode(SyntaxType.OctalLiteral, this.lexer.getStartPosition());
                break;
            case SyntaxType.FloatLiteral:
                literal = <FloatLiteral>this.createNode(SyntaxType.FloatLiteral, this.lexer.getStartPosition());
                break;
            case SyntaxType.HexLiteral:
                literal = <HexLiteral>this.createNode(SyntaxType.HexLiteral, this.lexer.getStartPosition());
                break;
            case SyntaxType.TrueKeyword:
            case SyntaxType.FalseKeyword:
                literal = <BooleanLiteral>this.createNode(this.token(), this.lexer.getStartPosition());
                break;
            default:
                throw new Error(`could not parse literal from token ${this.token()}`);
        }

        literal.text = this.lexer.getTokenValue();

        this.finishNode(literal);
        this.nextToken();
        return literal;
    }

    private parseSyntaxDeclaration(): SyntaxStatement {
        const syntaxStatement = <SyntaxStatement>this.createNode(SyntaxType.SyntaxStatement, this.lexer.getTokenPosition());
        this.parseExpected(SyntaxType.SyntaxKeyword);
        this.parseExpected(SyntaxType.EqualsToken);

        if (this.token() === SyntaxType.StringLiteral) {
            const version = <StringLiteral>this.parseLiteral();
            switch (version.text) {
                case 'proto3':
                case 'proto2':
                    break;
                default: {
                    throw new Error(`unrecogninzed syntax mode '${version.text}'`);
                }
            }
            syntaxStatement.version = version;
        } else {
            throw new Error(`expected valid syntax mode string`);
        }

        this.parseExpected(SyntaxType.SemicolonToken);
        return this.finishNode(syntaxStatement);
    }

    private createNode< Kind extends SyntaxType>(kind: SyntaxType, position?: number): Node | Token<Kind> | Identifier {
        this.nodeCount++;

        if (position < 0) {
            position = this.lexer.getStartPosition();
        }

        return this.isNode(kind) ? <Node>{ kind, start: position, end: position } :
            (kind === SyntaxType.Identifier) ? <Identifier>{ kind, start: position, end: position } :
            <Token<Kind>>{ kind, start: position, end: position };
    }

    private createNodeArray<T extends Node>(elements?: ReadonlyArray<T>): NodeArray<T > {
        if (elements) {
            if (elements.hasOwnProperty('start') && elements.hasOwnProperty('end')) {
                return <NodeArray<T>>elements;
            }
        } else {
            elements = [];
        }

        const array = <NodeArray<T>>elements;
        array.start = -1;
        array.end = -1;
        return array;
    }

    private isNode(kind: SyntaxType): boolean {
        return kind >= SyntaxType.FirstNode && kind <= SyntaxType.LastNode;
    }

    private finishNode<T extends Node>(node: T, end?: number): T {
        node.end = (end === undefined) ? this.lexer.getStartPosition() : end;
        return node;
    }
}