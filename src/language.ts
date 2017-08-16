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
    StreamKeyword,
    SyntaxKeyword,
    ImportKeyword,
    OneofKeyword,
    TrueKeyword,
    FalseKeyword,
    RPCKeyword,
    PackageKeyword,
    ReturnsKeyword,
    ServiceKeyword,
    MapKeyword,
    DoubleKeyword,
    FloatKeyword,
    Int32Keyword,
    Int64Keyword,
    Uint32Keyword,
    Uint64Keyword,
    Sint32Keyword,
    Sint64Keyword,
    Fixed32Keyword,
    Fixed64Keyword,
    Sfixed32Keyword,
    Sfixed64Keyword,
    BoolKeyword,
    StringKeyword,
    MaxKeyword,
    BytesKeyword,
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
    MessageDefinition,
    ServiceDefinition,
    EnumDefinition,
    EnumFieldStatement,
    MapFieldStatement,
    FieldStatement,
    OptionStatement,
    OneofStatement,
    ReservedStatement,
    Range,
    OneofFieldStatement,
    RPCStatement,
    FieldOption,
    // Markers
    FirstReserved = MessageKeyword,
    LastReserved = BytesKeyword,
    FirstNode = FullIdentifier,
    LastNode = FieldOption
}

/**
 * Baes abstraction for parse nodes.
 */
export interface Node extends Span {
    kind: SyntaxType;
    modifiers?: NodeArray<Modifier>;
    parent?: Node;
}

export type Modifier = Token<SyntaxType.PublicKeyword> |
    Token<SyntaxType.WeakKeyword> |
    Token<SyntaxType.RepeatedKeyword> |
    Token<SyntaxType.PlusToken> |
    Token<SyntaxType.MinusToken>;

/**
 * Represents an immutable collection of nodes.
 */
export interface NodeArray<T extends Node> extends ReadonlyArray<T>, Span { }

/**
 * Undecorated token parse node.
 */
export interface Token<TKind extends SyntaxType> extends Node {
    kind: TKind;
}

/**
 * Represents an identifier parse node.
 */
export interface Identifier extends Node {
    kind: SyntaxType.Identifier;
    text: string;
}

/**
 * Represents a full identifier of the form 'some.ident.chain'.
 */
export interface FullIdentifier extends Node {
    kind: SyntaxType.FullIdentifier;
    left?: Identifier | FullIdentifier;
    right: Identifier;
}

/**
 * Identifier for a message declaration.
 */
export interface MessageName extends Identifier {
    _messageNameBrand: any;
}

/**
 * Identifier for an enum declaration.
 */
export interface EnumName extends Identifier {
    _enumNameBrand: any;
}

/**
 * Identifier for a field.
 */
export interface FieldName extends Identifier {
    _fieldNameBrand: any;
}

/**
 * Identifier for a oneof declaration.
 */
export interface OneofName extends Identifier {
    _oneofNameBrand: any;
}

/**
 * Identifier for a map field.
 */
export interface MapName extends Identifier {
    _mapNameBrand: any;
}

/**
 * Identifier for a service declaration.
 */
export interface ServiceName extends Identifier {
    _serviceNameBrand: any;
}

/**
 * Identier for an RPC method declaration.
 */
export interface RPCName extends Identifier {
    _rpcNameBrand: any;
}

/**
 * Type identifier for a message type.
 */
export interface MessageType extends FullIdentifier {
    _messageTypeBrand: any;
}

/**
 * Type identifier for an enum type.
 */
export interface EnumType extends FullIdentifier {
    _enumTypeBrand: any;
}

/**
 * Literal value parse node.
 */
export interface Literal extends Node {
    text: string;
    isUnterminated?: boolean;
}

/**
 * String literal value parse node.
 */
export interface StringLiteral extends Literal {
    kind: SyntaxType.StringLiteral;
}

/**
 * Decimal literal value parse node.
 */
export interface DecimalLiteral extends Literal {
    kind: SyntaxType.DecimalLiteral;
}

/**
 * Octal literal value parse node.
 */
export interface OctalLiteral extends Literal {
    kind: SyntaxType.OctalLiteral;
}

/**
 * Hex literal value parse node.
 */
export interface HexLiteral extends Literal {
    kind: SyntaxType.HexLiteral;
}

export type IntegerLiteral = DecimalLiteral | OctalLiteral | HexLiteral;

/**
 * Boolean literal value parse node.
 */
export interface BooleanLiteral extends Literal {
    kind: SyntaxType.TrueKeyword | SyntaxType.FalseKeyword;
}

export interface Statement extends Node {
    _statementBrand: any;
}

/**
 * Syntax version declaration node.
 */
export interface SyntaxStatement extends Statement {
    type: SyntaxType.SyntaxStatement;
    version: StringLiteral;
}

/**
 * Import dependency statement node.
 */
export interface ImportStatement extends Statement {
    type: SyntaxType.ImportStatement;
    file: StringLiteral;
}

/**
 * Package name declaration node.
 */
export interface PackageStatement extends Statement {
    kind: SyntaxType.PackageStatement;
    name: FullIdentifier;
}

/**
 * Constant value parse node.
 */
export type Constant = FullIdentifier | IntegerLiteral | StringLiteral | BooleanLiteral;

/**
 * Option statement node.
 */
export interface OptionStatement extends Statement {
    kind: SyntaxType.OptionStatement;
    name: FullIdentifier;
    value: Constant;
}

export interface Type extends Node {
    _typeNodeBrand: any;
}

/**
 * Defines a known type declaration as part of a field.
 */
export interface KnownType extends Type {
    kind: SyntaxType.DoubleKeyword |
        SyntaxType.FloatKeyword |
        SyntaxType.Int32Keyword |
        SyntaxType.Int64Keyword |
        SyntaxType.Uint32Keyword |
        SyntaxType.Uint64Keyword |
        SyntaxType.Sint32Keyword |
        SyntaxType.Sint64Keyword |
        SyntaxType.Fixed32Keyword |
        SyntaxType.Fixed64Keyword |
        SyntaxType.Sfixed32Keyword |
        SyntaxType.Sfixed64Keyword |
        SyntaxType.BoolKeyword |
        SyntaxType.StringKeyword |
        SyntaxType.BytesKeyword;
}

export interface KeyType extends Type {
    kind: SyntaxType.Int32Keyword |
        SyntaxType.Int64Keyword |
        SyntaxType.Uint32Keyword |
        SyntaxType.Uint64Keyword |
        SyntaxType.Sint32Keyword |
        SyntaxType.Sint64Keyword |
        SyntaxType.Fixed32Keyword |
        SyntaxType.Fixed64Keyword |
        SyntaxType.Sfixed32Keyword |
        SyntaxType.Sfixed64Keyword |
        SyntaxType.BoolKeyword |
        SyntaxType.StringKeyword;
}

/**
 * Field statement declration node.
 */
export interface FieldStatement extends Statement {
    kind: SyntaxType.FieldStatement;

    type: KnownType | MessageType | EnumType;
    name: FieldName;
    number: IntegerLiteral;
    options: NodeArray<FieldOption>;
}

/**
 * Field option declaration as part of a field statement.
 */
export interface FieldOption extends Node {
    kind: SyntaxType.FieldOption;
    name: FullIdentifier;
    value: Constant;
}

/**
 * Oneof statement within a message.
 */
export interface OneofStatement extends Statement {
    kind: SyntaxType.OneofStatement;
    name: OneofName;
    fields: NodeArray<OneofFieldStatement>;
}

/**
 * Field statement node contained in a oneof statement.
 */
export interface OneofFieldStatement extends Statement {
    kind: SyntaxType.OneofFieldStatement;

    type: KnownType | MessageType | EnumType;

    name: FieldName;
    number: IntegerLiteral;
    options: NodeArray<FieldOption>;
}

export interface MapFieldStatement extends Statement {
    kind: SyntaxType.MapFieldStatement;
    key: KeyType;
    type: KnownType | MessageType | EnumType;
    name: FieldName;
    number: IntegerLiteral;
    options: NodeArray<FieldOption>;
}

/**
 * Reserved statement parse node.
 * May specify either a list of ranges or field names.
 */
export interface ReservedStatement extends Statement {
    kind: SyntaxType.ReservedStatement;
    ranges: NodeArray<Range> | NodeArray<FieldName>;
}

/**
 * Node representing a range that is part of a reserved statement.
 * For example '1 to 11' or '5'.
 */
export interface Range extends Node {
    kind: SyntaxType.Range;
    startIndex: IntegerLiteral;
    endIndex?: IntegerLiteral | Token<SyntaxType.MaxKeyword>;
}

/**
 * Represents an empty statement.
 */
export interface EmptyStatement extends Statement {
    kind: SyntaxType.EmptyStatement;
}

/**
 * Abstract parse node representing a top level definition.
 */
export interface TopLevelDefinition extends Statement {
    _topLevelDefinitionBrand: any;
}

/**
 * Represents an enumeration definition.
 */
export interface EnumDefinition extends TopLevelDefinition {
    kind: SyntaxType.EnumDefinition;
    name: EnumName;
    body: NodeArray<OptionStatement | EnumFieldStatement | EmptyStatement>;
}

/**
 * Represents the declaration of an enumeration field.
 */
export interface EnumFieldStatement extends Statement {
    kind: SyntaxType.EnumFieldStatement;
    name: Identifier;
    number: IntegerLiteral;

    options: NodeArray<FieldOption>;
}

/**
 * Utility union type to represent valid statements for the body of a message.
 */
export type MessageBodyStatement = OptionStatement |
    OneofStatement |
    FieldStatement |
    EnumDefinition |
    MessageDefinition |
    MapFieldStatement |
    ReservedStatement |
    EmptyStatement;


/**
 * Represents a message type definition.
 */
export interface MessageDefinition extends TopLevelDefinition {
    kind: SyntaxType.MessageDefinition;
    name: MessageName;
    body: NodeArray<MessageBodyStatement>;
}

/**
 * Represents a service type definition.
 */
export interface ServiceDefinition extends TopLevelDefinition {
    kind: SyntaxType.ServiceDefinition;
    name: ServiceName;
    body: NodeArray<OptionStatement | RPCStatement | EmptyStatement>;
}


/**
 * Represents an RPC statement as part of a service.
 */
export interface RPCStatement extends Statement {
    kind: SyntaxType.RPCStatement;
    name: RPCName;
    sendType: MessageType;

    receiveType: MessageType;
    body?: NodeArray<OptionStatement | EmptyStatement>;
}

/**
 * Utility union type representing valid statements for the root level of a source file.
 */
export type SourceFileStatement = ImportStatement | PackageStatement | OptionStatement | TopLevelDefinition | EmptyStatement;

/**
 * Represents a single source file parse unit.
 */
export interface SourceFile extends Node {
    kind: SyntaxType.SourceFile;

    fileName: string;
    path: string;
    endOfFileToken: Token<SyntaxType.EndOfFileToken>;
    text: string;
    syntax: SyntaxStatement;
    statements: NodeArray<SourceFileStatement>;
    dependenies: string[];
}