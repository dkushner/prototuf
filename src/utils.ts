// TODO(dkushner): Probably overkill for simple binary search.
import * as _ from 'lodash';

import { SyntaxType, CharacterCodes, SourceFile, Node } from './language';
import { MessageBodyStatement, TopLevelDefinition, SourceFileStatement } from './language';
import { PackageStatement, MessageDefinition, EnumDefinition, OneofStatement } from './language';
import { OneofFieldStatement, FieldStatement, ImportStatement } from './language';
import { NodeArray } from './language';
import { IntegerLiteral, KeyType, KnownType, Location } from './language';

export function isMessageBodyStatement(node: Node): node is MessageBodyStatement {
    return node.kind === SyntaxType.OneofStatement ||
        node.kind === SyntaxType.OptionStatement ||
        node.kind === SyntaxType.FieldStatement ||
        node.kind === SyntaxType.EnumDefinition ||
        node.kind === SyntaxType.MessageDefinition ||
        node.kind === SyntaxType.MapFieldStatement ||
        node.kind === SyntaxType.ReservedStatement ||
        node.kind === SyntaxType.EmptyStatement;
}

export function isTopLevelDefinition(node: Node): node is TopLevelDefinition {
    return node.kind === SyntaxType.EnumDefinition ||
        node.kind === SyntaxType.ServiceDefinition ||
        node.kind === SyntaxType.MessageDefinition;
}

export function isSourceFileStatement(node: Node): node is SourceFileStatement {
    return node.kind === SyntaxType.ImportStatement ||
        node.kind === SyntaxType.PackageStatement ||
        node.kind === SyntaxType.OptionStatement ||
        node.kind === SyntaxType.EmptyStatement ||
        isTopLevelDefinition(node);
}

export function isIntegerLiteral(node: Node): node is IntegerLiteral {
    return node.kind === SyntaxType.DecimalLiteral ||
        node.kind === SyntaxType.OctalLiteral ||
        node.kind === SyntaxType.HexLiteral;
}

export function isKeyType(node: Node): node is KeyType {
    return isKnownType(node) &&
        node.kind !== SyntaxType.BytesKeyword &&
        node.kind !== SyntaxType.DoubleKeyword &&
        node.kind !== SyntaxType.FloatKeyword;
}

export function isKnownType(node: Node): node is KnownType {
    return (node.kind >= SyntaxType.FirstKnown) && (node.kind <= SyntaxType.LastKnown);
}
/**
 * Determines line start positions for a source file.
 * @param sourceFile source file to delineate
 */
export function getLineStarts(sourceFile: SourceFile): number[] {
    return sourceFile.lineStarts || (sourceFile.lineStarts = computeLineStarts(sourceFile.text));
}

/**
 * Determines the line and column location of a character position in a source file.
 * @param sourceFile the source file context of the location
 * @param position the character position to locate
 */
export function getLocation(sourceFile: SourceFile, position: number): Location {
    const lineStarts = getLineStarts(sourceFile);
    const line = _.sortedIndex(lineStarts, position);

    return {
        line: line - 1,
        character: position - lineStarts[line - 1]
    };
}

/**
 * Creates an array of character positions that indicate line starts.
 * @param text corpus to find line starts in
 */
export function computeLineStarts(text: string): number[] {
    const result: number[] = new Array();

    let position = 0;
    let lineStart = 0;

    while (position < text.length) {
        const character = text.charCodeAt(position);
        position++;
        switch (character) {
            case CharacterCodes.CarriageReturn:
                if (text.charCodeAt(position) === CharacterCodes.LineFeed) {
                    position++;
                }
            case CharacterCodes.LineFeed:
                result.push(lineStart);
                lineStart = position;
                break;
            default:
                if (character > CharacterCodes.MaxCharacter && isLineBreak(character)) {
                    result.push(lineStart);
                    lineStart = position;
                }
                break;
        }
    }
    result.push(lineStart);
    return result;
}

/**
 * Determines if a given character code represents a single-line whitespace character.
 * @param character character code to check
 */
export function isSingleLineWhitespace(character: number): boolean {
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

/**
 * Determines if a given character code represents a decimal value.
 * @param character character code to check
 */
export function isDecimal(character: number): boolean {
    return (character >= CharacterCodes.Zero) && (character <= CharacterCodes.Nine);
}

export function isLineBreak(character: number): boolean {
    return character === CharacterCodes.LineFeed ||
        character === CharacterCodes.CarriageReturn ||
        character === CharacterCodes.LineSeparator ||
        character === CharacterCodes.ParagraphSeparator;
}

export function isOctalDigit(character: number): boolean {
    return (character >= CharacterCodes.Zero) && (character <= CharacterCodes.Seven);
}

export function isIdentifierStart(character: number): boolean {
    return (character >= CharacterCodes.A && character <= CharacterCodes.Z) ||
        (character >= CharacterCodes.CapitalA && character <= CharacterCodes.CapitalZ);
}

export function isIdentifierPart(character: number): boolean {
    return (character === CharacterCodes.Underscore) ||
        (character >= CharacterCodes.A && character <= CharacterCodes.Z) ||
        (character >= CharacterCodes.CapitalA && character <= CharacterCodes.CapitalZ) ||
        (character >= CharacterCodes.Zero && character <= CharacterCodes.Nine);
}

export function utf16EncodeAsString(codePoint: number): string {
    if (codePoint <= 65535) {
        return String.fromCharCode(codePoint);
    }

    const codeUnit1 = Math.floor((codePoint - 65536) / 1024) + 0xD800;
    const codeUnit2 = ((codePoint - 65536) % 1024) + 0xDC00;

    return String.fromCharCode(codeUnit1, codeUnit2);
}

export function forEachChild(node: Node, callback: (node: Node) => void) {
    if (!node || node.kind < SyntaxType.FirstNode || node.kind > SyntaxType.LastNode) {
        return;
    }

    switch (node.kind) {
        case SyntaxType.PackageStatement:
            return visitNodes((node as PackageStatement).modifiers, callback) ||
                visitNode((node as PackageStatement).name, callback);
        case SyntaxType.MessageDefinition:
            return visitNode((node as MessageDefinition).name, callback) ||
                visitNodes((node as MessageDefinition).body, callback);
        case SyntaxType.EnumDefinition:
            return visitNode((node as EnumDefinition).name, callback) ||
                visitNodes((node as EnumDefinition).body, callback);
        case SyntaxType.OneofStatement:
            return visitNode((node as OneofStatement).name, callback) ||
                visitNodes((node as OneofStatement).fields, callback);
        case SyntaxType.SourceFile:
            return visitNode((node as SourceFile).syntax, callback) ||
                visitNodes((node as SourceFile).statements, callback) ||
                visitNode((node as SourceFile).endOfFileToken, callback);
        case SyntaxType.ImportStatement:
            return visitNodes((node as ImportStatement).modifiers, callback) ||
                visitNode((node as ImportStatement).file, callback);
    }
}

export function visitNode<T>(node: Node, callback: (node: Node) => T): T | undefined {
    return node && callback(node);
}

export function visitNodes<T>(nodes: NodeArray<Node>, callback: (node: Node) => T): T | undefined {
    for (const node of nodes) {
        const result = callback(node);
        if (result) {
            return result;
        }
    }
}