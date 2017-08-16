import * as pb from 'protobufjs';

export interface Span {
    start: number;
    end: number;
}

export const enum CharacterCodes {
    Null = 0,
    MaxCharacter = 0x7F,

    LineFeed = 0x0A,              // \n
    CarriageReturn = 0x0D,        // \r
    LineSeparator = 0x2028,
    ParagraphSeparator = 0x2029,
    NextLine = 0x0085,

    // Unicode 3.0 space characters
    Space = 0x0020,   // " "
    NonBreakingSpace = 0x00A0,   //
    EnQuad = 0x2000,
    EmQuad = 0x2001,
    EnSpace = 0x2002,
    EmSpace = 0x2003,
    ThreePerEmSpace = 0x2004,
    FourPerEmSpace = 0x2005,
    SixPerEmSpace = 0x2006,
    FigureSpace = 0x2007,
    PunctuationSpace = 0x20,
    ThinSpace = 0x2009,
    HairSpace = 0x200A,
    ZeroWidthSpace = 0x200B,
    NarrowNoBreakSpace = 0x202F,
    IdeographicSpace = 0x3000,
    MathematicalSpace = 0x205F,
    Ogham = 0x1680,

    Underscore = 0x5F,

    Zero = 0x30,
    One = 0x31,
    Two = 0x32,
    Three = 0x33,
    Four = 0x34,
    Five = 0x35,
    Six = 0x36,
    Seven = 0x37,
    Eight = 0x38,
    Nine = 0x39,

    A = 0x61,
    B = 0x62,
    C = 0x63,
    D = 0x64,
    E = 0x65,
    F = 0x66,
    G = 0x67,
    H = 0x68,
    I = 0x69,
    J = 0x6A,
    K = 0x6B,
    L = 0x6C,
    M = 0x6D,
    N = 0x6E,
    O = 0x6F,
    P = 0x70,
    Q = 0x71,
    R = 0x72,
    S = 0x73,
    T = 0x74,
    U = 0x75,
    V = 0x76,
    W = 0x77,
    X = 0x78,
    Y = 0x79,
    Z = 0x7A,

    CapitalA = 0x41,
    CapitalB = 0x42,
    CapitalC = 0x43,
    CapitalD = 0x44,
    CapitalE = 0x45,
    CapitalF = 0x46,
    CapitalG = 0x47,
    CapitalH = 0x48,
    CapitalI = 0x49,
    CapitalJ = 0x4A,
    CapitalK = 0x4B,
    CapitalL = 0x4C,
    CapitalM = 0x4D,
    CapitalN = 0x4E,
    CapitalO = 0x4F,
    CapitalP = 0x50,
    CapitalQ = 0x51,
    CapitalR = 0x52,
    CapitalS = 0x53,
    CapitalT = 0x54,
    CapitalU = 0x55,
    CapitalV = 0x56,
    CapitalW = 0x57,
    CapitalX = 0x58,
    CapitalY = 0x59,
    CapitalZ = 0x5a,

    Ampersand = 0x26,             // &
    Asterisk = 0x2A,              // *
    At = 0x40,                    // @
    Backslash = 0x5C,             // \
    Backtick = 0x60,              // `
    Bar = 0x7C,                   // |
    Caret = 0x5E,                 // ^
    CloseBrace = 0x7D,            // }
    CloseBracket = 0x5D,          // ]
    CloseParen = 0x29,            // )
    Colon = 0x3A,                 // :
    Comma = 0x2C,                 // ,
    Dot = 0x2E,                   // .
    DoubleQuote = 0x22,           // "
    Equals = 0x3D,                // =
    Exclamation = 0x21,           // !
    GreaterThan = 0x3E,           // >
    Hash = 0x23,                  // #
    LessThan = 0x3C,              // <
    Minus = 0x2D,                 // -
    OpenBrace = 0x7B,             // {
    OpenBracket = 0x5B,           // [
    OpenParen = 0x28,             // (
    Percent = 0x25,               // %
    Plus = 0x2B,                  // +
    Question = 0x3F,              // ?
    Semicolon = 0x3B,             // ;
    SingleQuote = 0x27,           // '
    Slash = 0x2F,                 // /
    Tilde = 0x7E,                 // ~

    Backspace = 0x08,             // \b
    FormFeed = 0x0C,              // \f
    ByteOrderMark = 0xFEFF,
    Tab = 0x09,                   // \t
    VerticalTab = 0x0B,           // \v
}

export const enum SyntaxType {
    // Structural
    Unknown,
    SourceFile,
    // Trivia
    NewLineTrivia,
    WhitespaceTrivia,
    SingleLineCommentTrivia,
    MultiLineCommentTrivia,
    // Tokens
    EndOfFileToken,
    EqualsToken,
    DotToken,
    UnderscoreToken,
    OpenBraceToken,
    CloseBraceToken,
    OpenParenToken,
    CloseParenToken,
    OpenBracketToken,
    CloseBracketToken,
    SemicolonToken,
    SlashToken,
    LessThanToken,
    GreaterThanToken,
    MinusToken,
    PlusToken,
    CommaToken,
    // Identifiers
    Identifier,
    // Reserved
    MessageKeyword,
    OptionKeyword,
    ReservedKeyword,
    RepeatedKeyword,
    EnumKeyword,
    WeakKeyword,
    PublicKeyword,
    SyntaxKeyword,
    ImportKeyword,
    OneofKeyword,
    RPCKeyword,
    PackageKeyword,
    ReturnsKeyword,
    ServiceKeyword,
    // Parse Nodes
    FullIdentifier,
    // Literals
    DecimalLiteral,
    OctalLiteral,
    HexLiteral,
    FloatLiteral,
    BooleanLiteral,
    StringLiteral,
    // Elements
    EmptyStatement,
    SyntaxStatement,
    ImportStatement,
    PackageStatement,
    MessageDeclaration,
    EnumDeclaration,
    OptionStatement,
    // Expression
    UnaryExpression,
    // Markers
    FirstReserved = MessageKeyword,
    LastReserved = ServiceKeyword,
    FirstNode = FullIdentifier,
    LastNode = UnaryExpression
}

export type Path = string;

/**
 * Represents a unary operator.
 * Only two are valid in the Protobuf language, '+' and '-'.
 */
export type UnaryOperator = SyntaxType.PlusToken | SyntaxType.MinusToken;

/**
 * Represent modifiers used to condition some nodes.
 */
export type Modifier = Token<SyntaxType.PublicKeyword> |
    Token<SyntaxType.WeakKeyword>;

/**
 * Represents an expression containing a unary operator and a numeric literal operand.
 * Since Protobuf has no concept of variable binding, unary expressions are only
 * valid in this circumstance.
 */
export interface UnaryExpression extends Expression {
    kind: SyntaxType.UnaryExpression;
    operator: UnaryOperator;
    operand: NumericLiteral;
}

/**
 * Represents any expression that yields a literal value.
 */
export interface LiteralExpression extends Expression {
    text: string;
}

/**
 * Represents a string literal value.
 */
export interface StringLiteral extends LiteralExpression {
    type: SyntaxType.StringLiteral;
}

export type NumericType = SyntaxType.FloatLiteral |
    SyntaxType.DecimalLiteral |
    SyntaxType.OctalLiteral |
    SyntaxType.HexLiteral;

/**
 * Represents a numeric literal value.
 */
export interface NumericLiteral extends LiteralExpression {
    kind: NumericType;
    value: number;
}

export interface FloatLiteral extends NumericLiteral {
    kind: SyntaxType.FloatLiteral;
}

export interface OctalLiteral extends NumericLiteral {
    kind: SyntaxType.OctalLiteral;
}

export interface DecimalLiteral extends NumericLiteral {
    kind: SyntaxType.DecimalLiteral;
}

export interface HexLiteral extends NumericLiteral {
    kind: SyntaxType.HexLiteral;
}

export interface BooleanLiteral extends LiteralExpression {
    kind: SyntaxType.BooleanLiteral;
}

/**
 * Represents an integer literal value node.
 */
export type IntegerLiteral = DecimalLiteral | OctalLiteral | HexLiteral;

/**
 * Represents a constant value node.
 */
export type ConstantExpression = FullIdentifier | IntegerLiteral |
    StringLiteral | BooleanLiteral | UnaryExpression;

export interface Node extends Span {
    kind: SyntaxType;
    parent?: Node;
}

export interface NodeArray<T extends Node> extends ReadonlyArray<T>, Span { }

export interface Token<Kind extends SyntaxType> extends Node {
    kind: Kind;
}

export interface Identifier extends Expression {
    kind: SyntaxType.Identifier;
}

/**
 * Represents an expression involving a series of identifiers.
 * For example, some.package.Type or some.package.my_option.
 */
export interface FullIdentifier extends Expression {
    kind: SyntaxType.FullIdentifier;
    path: Identifier | FullIdentifier;
    name: Identifier;
}

// Represents an individual protobuf definition file.
export interface SourceFile extends Declaration {
    kind: SyntaxType.SourceFile;

    fileName: string;
    path: Path;
    endOfFileToken: Token<SyntaxType.EndOfFileToken>;
    text: string;
    statements: NodeArray<Statement>;
    packageName: string;
    syntax: SyntaxStatement;
    dependenies: Path[];
}

/**
 * Represents a parse node that states some association between subsequent nodes.
 */
export interface Statement extends Node { }

/**
 * Represents a parse node that simply declares the existence of something.
 */
export interface Declaration extends Node { }

/**
 * Represents a parse node that may be evaluated.
 */
export interface Expression { }

/**
 * Represents a declaration (that it is) and a statement (what it is) in a combined
 * parse node. Note that it is not an expression because it has no intrinsic value.
 */
export interface DeclarationStatement extends Statement, Declaration {
    name?: Identifier;
}

export interface PackageDeclaration extends DeclarationStatement {
}

/**
 * Parse node representing the declaration of a message type.
 */
export interface MessageDeclaration extends DeclarationStatement {
    kind: SyntaxType.MessageDeclaration;
}

export interface EnumDeclaration extends DeclarationStatement {
    kind: SyntaxType.EnumDeclaration;
}

/**
 * Represents a null associative statement.
 */
export interface EmptyStatement extends Statement {
    kind: SyntaxType.EmptyStatement;
}

/**
 * Represents the syntax version associated with a file.
 */
export interface SyntaxStatement extends Statement {
    kind: SyntaxType.SyntaxStatement;
    version: number;
}

/**
 * Represents an dependency import parse node.
 */
export interface ImportStatement extends Statement {
    kind: SyntaxType.ImportStatement;
    parent?: SourceFile;
    modifier?: Modifier;
    fileReference: string;
}

export interface OptionStatement extends Statement {
    kind: SyntaxType.OptionStatement;
    name: Identifier | FullIdentifier;
    constant: ConstantExpression;
}

export interface Location {
    line: number;
    character: number;
}