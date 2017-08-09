import { SyntaxType, CharacterCodes } from './language';

export enum SyntaxTarget {
    PROTO2,
    PROTO3
}

export const enum NumericFlags {
    None = 0,
    Scientific = 1 << 1,        // e.g. `10e2`
    Octal = 1 << 2,             // e.g. `0777`
    Hex = 1 << 3      // e.g. `0x00000000`
}

function isSingleLineWhitespace(character: number): boolean {
    return character === CharacterCodes.Space ||
        character === CharacterCodes.Tab ||
        character === CharacterCodes.VerticalTab ||
        character === CharacterCodes.FormFeed ||
        character === CharacterCodes.NonBreakingSpace ||
        character === CharacterCodes.Ogham ||
        character >= CharacterCodes.EnQuad && character <= CharacterCodes.ZeroWidthSpace ||
        character === CharacterCodes.NarrowNoBreakSpace ||
        character === CharacterCodes.MathematicalSpace ||
        character === CharacterCodes.IdeographicSpace ||
        character === CharacterCodes.ByteOrderMark;
}

function isDecimal(character: number): boolean {
    return (character >= CharacterCodes.Zero) && (character <= CharacterCodes.Nine);
}

function isLineBreak(character: number): boolean {
    return character === CharacterCodes.LineFeed ||
        character === CharacterCodes.CarriageReturn ||
        character === CharacterCodes.LineSeparator ||
        character === CharacterCodes.ParagraphSeparator;
}

function isOctalDigit(character: number): boolean {
    return (character >= CharacterCodes.Zero) && (character <= CharacterCodes.Seven);
}

export interface ErrorHandler {
    (message: string): void;
}

export class Lexer {
    private text: string;
    private target: SyntaxTarget;
    private skipTrivia: boolean;

    private position: number;
    private end: number;
    private startPosition: number;
    private tokenPosition: number;

    private token: SyntaxType;
    private tokenValue: string;
    private precedingLineBreak: boolean;
    private unterminated: boolean;
    private extendedEscape: boolean;
    private numericFlags: NumericFlags;

    private errorHandler: ErrorHandler;

    constructor(target: SyntaxTarget, skipTrivia: boolean, errorHandler?: ErrorHandler, text?: string, start?: number, length?: number) {
        this.target = target;
        this.skipTrivia = skipTrivia;
        this.errorHandler = errorHandler;
        this.setText(text, start, length);
    }

    public getStartPosition(): number {
        return this.startPosition;
    }

    public getToken(): SyntaxType {
        return this.token;
    }

    public getTextPosition(): number {
        return this.position;
    }

    public getTokenPosition(): number {
        return this.tokenPosition;
    }

    public getTokenText(): string {
        return this.text.substring(this.tokenPosition, this.position);
    }

    public getTokenValue(): string {
        return this.tokenValue;
    }

    public hasPrecedingLineBreak(): boolean {
        return this.precedingLineBreak;
    }

    // This is kept internal because its value may depend on the target syntax.
    public isIdentifier(): boolean {
        return this.token === SyntaxType.Identifier;
    }

    // This is kept internal because its value may depend on the target syntax.
    public isReservedWord(): boolean {
        return this.token >= SyntaxType.FirstReserved && this.token <= SyntaxType.LastReserved;
    }

    public isUnterminated(): boolean {
        return this.unterminated;
    }

    public scan(): SyntaxType {
        this.startPosition = this.position;
        this.precedingLineBreak = false;
        this.unterminated = false;
        this.numericFlags = NumericFlags.None;

        while (true) {
            this.tokenPosition = this.position;
            if (this.position >= this.end) {
                return this.token = SyntaxType.EndOfFileToken;
            }

            let character = this.text.charCodeAt(this.position);
            switch (character) {
                case CharacterCodes.LineFeed:
                case CharacterCodes.CarriageReturn: {
                    this.precedingLineBreak = true;
                    if (this.skipTrivia) {
                        this.position++;
                        continue;
                    }

                    const inBounds = (this.position + 1 < this.end);
                    const peekNext = (inBounds) ? this.text.charCodeAt(this.position + 1) : undefined;
                    if (character === CharacterCodes.CarriageReturn && inBounds && peekNext === CharacterCodes.LineFeed) {
                        this.position += 2;
                    } else {
                        this.position++;
                    }
                    return this.token = SyntaxType.NewLineTrivia;
                }
                case CharacterCodes.Tab:
                case CharacterCodes.VerticalTab:
                case CharacterCodes.FormFeed:
                case CharacterCodes.Space:
                    if (this.skipTrivia) {
                        this.position++;
                        continue;
                    }

                    while (this.position < this.end && isSingleLineWhitespace(this.text.charCodeAt(this.position))) {
                        this.position++;
                    }
                    return this.token = SyntaxType.WhitespaceTrivia;
                case CharacterCodes.DoubleQuote:
                case CharacterCodes.SingleQuote:
                    this.tokenValue = this.scanString();
                    return this.token = SyntaxType.StringLiteral;
                case CharacterCodes.OpenParen:
                    this.position++;
                    return this.token = SyntaxType.OpenParenToken;
                case CharacterCodes.CloseParen:
                    this.position++;
                    return this.token = SyntaxType.CloseParenToken;
                case CharacterCodes.Comma:
                    this.position++;
                    return this.token = SyntaxType.CommaToken;
                case CharacterCodes.Minus:
                    this.position++;
                    return this.token = SyntaxType.MinusToken;
                case CharacterCodes.Dot:
                    if (isDecimal(this.text.charCodeAt(this.position + 1))) {
                        this.tokenValue = this.scanNumber();
                        return this.token = SyntaxType.FloatLiteral;
                    }
                    this.position++;
                    return this.token = SyntaxType.DotToken;
                case CharacterCodes.Slash:
                    if (this.text.charCodeAt(this.position + 1) === CharacterCodes.Slash) {
                        this.position += 2;

                        while (this.position < this.end) {
                            if (isLineBreak(this.text.charCodeAt(this.position))) {
                                break;
                            }
                            this.position++;
                        }

                        if (this.skipTrivia) {
                            continue;
                        }

                        return this.token = SyntaxType.SingleLineCommentTrivia;
                    }

                    if (this.text.charCodeAt(this.position + 1) === CharacterCodes.Asterisk) {
                        this.position += 2;

                        let commentClosed = false;
                        while (this.position < this.end) {
                            const character = this.text.charCodeAt(this.position);

                            if (character === CharacterCodes.Asterisk && this.text.charCodeAt(this.position + 1) === CharacterCodes.Slash) {
                                this.position++;
                                commentClosed = true;
                                break;
                            }

                            if (isLineBreak(character)) {
                                this.precedingLineBreak = true;
                            }
                            this.position++;
                        }

                        if (!commentClosed) {
                            this.error(`expected block comment close`);
                        }

                        if (this.skipTrivia) {
                            continue;
                        }

                        this.unterminated = !commentClosed;
                        return this.token = SyntaxType.MultiLineCommentTrivia;
                    }

                    this.position++;
                    return this.token = SyntaxType.SlashToken;
                case CharacterCodes.Zero: {
                    const inBounds = (this.position + 2 < this.end);
                    const peekNext = inBounds ? this.text.charCodeAt(this.position + 1) : undefined;
                    if (inBounds && (peekNext === CharacterCodes.CapitalX) || (peekNext === CharacterCodes.X)) {
                        this.position += 2;
                        let value = this.scanHexDigits(1);
                        if (value < 0) {
                            this.error(`expected hexadecimal digit`);
                            value = 0;
                        }

                        this.tokenValue = '' + value;
                        this.numericFlags = NumericFlags.Hex;
                        return this.token = SyntaxType.HexLiteral;
                    }

                    if (this.position + 1 < this.end && isOctalDigit(this.text.charCodeAt(this.position + 1))) {
                        this.tokenValue = '' + this.scanOctalDigits();
                        this.numericFlags = NumericFlags.Octal;
                        return this.token = SyntaxType.OctalLiteral;
                    }
                }
                case CharacterCodes.One:
                case CharacterCodes.Two:
                case CharacterCodes.Three:
                case CharacterCodes.Four:
                case CharacterCodes.Five:
                case CharacterCodes.Six:
                case CharacterCodes.Seven:
                case CharacterCodes.Eight:
                case CharacterCodes.Nine:
                    this.tokenValue = this.scanDecimal();
                    return this.token = SyntaxType.DecimalLiteral;
                case CharacterCodes.Semicolon:
                    this.position++;
                    return this.token = SyntaxType.SemicolonToken;
                case CharacterCodes.LessThan:
                    this.position++;
                    return this.token = SyntaxType.LessThanToken;
                case CharacterCodes.Equals:
                    this.position++;
                    return this.token = SyntaxType.EqualsToken;
                case CharacterCodes.GreaterThan:
                    this.position++;
                    return this.token = SyntaxType.GreaterThanToken;
                case CharacterCodes.OpenBracket:
                    this.position++;
                    return this.token = SyntaxType.OpenBracketToken;
                case CharacterCodes.CloseBracket:
                    this.position++;
                    return this.token = SyntaxType.CloseBracketToken;
                case CharacterCodes.OpenBrace:
                    this.position++;
                    return this.token = SyntaxType.OpenBraceToken;
                case CharacterCodes.CloseBrace:
                    this.position++;
                    return this.token = SyntaxType.CloseBraceToken;
                default:
                    if (isIdentifierStart(character)) {
                        this.position++;
                        while (this.position < this.end && isIdentifierPart(character = this.text.charCodeAt(this.position))) {
                            this.position++;
                        }
                        this.tokenValue = this.text.substring(this.tokenPosition, this.position);
                        return this.token = this.getIdentifierToken();
                    }

                    if (isSingleLineWhitespace(character)) {
                        this.position++;
                        continue;
                    }

                    if (isLineBreak(character)) {
                        this.precedingLineBreak = true;
                        this.position++;
                        continue;
                    }

                    this.error(`invalid character`);
                    this.position++;
                    return this.token = SyntaxType.Unknown;
            }
        }
    }

    public scanDecimal(): string {

    }

    public scanOctalDigits(): number {
        const start = this.position;
        while (isOctalDigit(this.text.charCodeAt(this.position))) {
            this.position++;
        }
        return +(this.text.substring(start, this.position));
    }

    public scanHexDigits(count: number, exact = false): number {
        let digits = 0;
        let value = 0;
        while (digits < count || !exact) {
            const character = this.text.charCodeAt(this.position);
            if (character >= CharacterCodes.Zero && character <= CharacterCodes.Nine) {
                value = value * 16 + character - CharacterCodes.Zero;
            } else if (character >= CharacterCodes.A && character <= CharacterCodes.F) {
                value = value * 16 + character - CharacterCodes.A + 10;
            } else if (character >= CharacterCodes.CapitalA && character <= CharacterCodes.CapitalF) {
                value = value * 16 + character - CharacterCodes.CapitalA + 10;
            } else {
                break;
            }

            this.position++;
            digits++;
        }

        if (digits < count) {
            return -1;
        }
        return value;
    }
    public scanNumber(): string {
        const start = this.position;
        while (isDecimal(this.text.charCodeAt(this.position))) {
            this.position++;
        }

        if (this.text.charCodeAt(this.position) === CharacterCodes.Dot) {
            this.position++;
            while (isDecimal(this.text.charCodeAt(this.position)))
                this.position++;
        }

        let end = this.position;
        if (this.text.charCodeAt(this.position) === CharacterCodes.E || this.text.charCodeAt(this.position) === CharacterCodes.CapitalE) {
            this.position++;
            this.numericFlags = NumericFlags.Scientific;

            if (this.text.charCodeAt(this.position) === CharacterCodes.Plus || this.text.charCodeAt(this.position) === CharacterCodes.Minus) {
                this.position++;
            }

            if (isDecimal(this.text.charCodeAt(this.position))) {
                this.position++;
                while (isDecimal(this.text.charCodeAt(this.position))) {
                    this.position++;
                }
                end = this.position;
            } else {
                this.error(`decimal value expected`);
            }
        }
        return '' + (this.text.substring(start, end));
    }

    public getText(): string {
        return this.text;
    }
    public setText(text: string, start?: number, length?: number): void {
        this.text = text;
        this.end = length === undefined ? text.length : start + length;
        this.setTextPosition(start || 0);
    }
    public setSyntaxTarget(target: SyntaxTarget): void { }
    public setTextPosition(position: number): void { }
    public lookAhead<T>(callback: () => T): T { }
    public scanRange<T>(start: number, length: number, callback: () => T): T { }
    public tryScan<T>(callback: () => T): T { }

    private error(message: string): void {
        if (this.errorHandler) {
            this.errorHandler(message);
        }
    }

    private scanString(allowEscapes = true): string {
        const quote = this.text.charCodeAt(this.position);
        this.position++;

        let result = '';
        let start = this.position;

        while (true) {
            if (this.position >= this.end) {
                result += text.substring(start, this.position);
                this.unterminated = true;
                this.error(`unterminated string literal`);
                continue;
            }

            const character = this.text.charCodeAt(this.position);
            if (character === quote) {
                result += this.text.substring(start, this.position);
                this.position++;
                break;
            }

            if (character === CharacterCodes.Backslash && allowEscapes) {
                result += this.text.substring(start, this.position);
                result += scanEscapeSequence();
                start = this.position;
                continue;
            }

            if (isLineBreak(character)) {
                result += this.text.substring(start, this.position);
                this.unterminated = true;
                this.error(`unterminated string literal`);
                break;
            }

            this.position++;
        }

        return result;
    }

    private scanEscapeSequence(): string {
        this.position++;
        if (this.position >= this.end) {
            this.error(`unexpected end of text`);
            return '';
        }

        const character = this.text.charCodeAt(this.position);
        this.position++;

        switch (character) {
            case CharacterCodes.Zero:
                return '\0';
            case CharacterCodes.B:
                return '\b';
            case CharacterCodes.T:
                return '\t';
            case CharacterCodes.N:
                return '\n';
            case CharacterCodes.V:
                return '\v';
            case CharacterCodes.F:
                return '\f';
            case CharacterCodes.R:
                return '\r';
            case CharacterCodes.SingleQuote:
                return '\'';
            case CharacterCodes.DoubleQuote:
                return '\"';
            case CharacterCodes.U:
                if (this.position < this.end && this.text.charCodeAt(this.position) === CharacterCodes.OpenBrace) {
                    this.extendedEscape = true;
                    this.position++;
                    return scanExtendedUnicodeEscape();
                }
                return scanHexEscape(4);
            case CharacterCodes.X:
                return scanHexEscape(2);
            case CharacterCodes.CarriageReturn:
                if (this.position < this.end && this.text.charCodeAt(this.position) === CharacterCodes.LineFeed) {
                    this.position++;
                }
            case CharacterCodes.LineFeed:
            case CharacterCodes.LineSeparator:
            case CharacterCodes.ParagraphSeparator:
                return '';
            default:
                return String.fromCharCode(character);
        }
    }
}