import {} from 'jest';
import * as path from 'path';
import * as fs from 'fs';
import { assert } from 'chai';
import { Lexer } from '../src/lexer';
import { SyntaxType, SyntaxTarget } from '../src/language';
import { inspect } from 'util';

describe('lexer', () => {
    it('tokenizes float numbers correctly', () => {
        const lexer = new Lexer(SyntaxTarget.PROTO3, true, (err: string) => { }, '.3210 123.456');

        const first = lexer.scan();
        const firstValue = lexer.getTokenValue();

        const second = lexer.scan();
        const secondValue = lexer.getTokenValue();

        assert.equal(first, SyntaxType.FloatLiteral);
        assert.equal(parseFloat(firstValue), 0.3210);

        assert.equal(second, SyntaxType.FloatLiteral);
        assert.equal(parseFloat(secondValue), 123.456);
    });

    it('tokenizes decimal numbers correctly', () => {
        const lexer = new Lexer(SyntaxTarget.PROTO3, true, (err: string) => { }, '1 1234');

        const first = lexer.scan();
        const firstValue = lexer.getTokenValue();

        const second = lexer.scan();
        const secondValue = lexer.getTokenValue();

        assert.equal(first, SyntaxType.DecimalLiteral);
        assert.equal(parseInt(firstValue), 1);
        assert.equal(second, SyntaxType.DecimalLiteral);
        assert.equal(parseInt(secondValue), 1234);
    });

    it('tokenizes scientific notation correctly', () => {
        const lexer = new Lexer(SyntaxTarget.PROTO3, true, (err: string) => { }, '133e-1 1.56E5');

        const first = lexer.scan();
        const firstValue = lexer.getTokenValue();

        const second = lexer.scan();
        const secondValue = lexer.getTokenValue();

        assert.equal(first, SyntaxType.FloatLiteral);
        assert.equal(parseFloat(firstValue), 13.3);
        assert.equal(second, SyntaxType.FloatLiteral);
        assert.equal(parseFloat(secondValue), 156000);
    });

    it('tokenizes octal numbers correctly', () => {
        const lexer = new Lexer(SyntaxTarget.PROTO3, true, (err: string) => { }, '01243116');

        const first = lexer.scan();
        const firstValue = lexer.getTokenValue();

        assert.equal(first, SyntaxType.OctalLiteral);
        assert.equal(parseInt(firstValue), 345678);
    });

    it('tokenizes hex numbers correctly', () => {
        const lexer = new Lexer(SyntaxTarget.PROTO3, true, (err: string) => { }, '0xDEADBEEF 0Xcafebabe');

        const first = lexer.scan();
        const firstValue = lexer.getTokenValue();

        const second = lexer.scan();
        const secondValue = lexer.getTokenValue();

        assert.equal(first, SyntaxType.HexLiteral);
        assert.equal(parseFloat(firstValue), 3735928559);
        assert.equal(second, SyntaxType.HexLiteral);
        assert.equal(parseFloat(secondValue), 3405691582);
    });

    it('tokenizes special characters correctly', () => {
        const lexer = new Lexer(SyntaxTarget.PROTO3, true, (err: string) => { }, ')(}{][./+-><=');

        const wanted = [
            SyntaxType.CloseParenToken,
            SyntaxType.OpenParenToken,
            SyntaxType.CloseBraceToken,
            SyntaxType.OpenBraceToken,
            SyntaxType.CloseBracketToken,
            SyntaxType.OpenBracketToken,
            SyntaxType.DotToken,
            SyntaxType.SlashToken,
            SyntaxType.PlusToken,
            SyntaxType.MinusToken,
            SyntaxType.GreaterThanToken,
            SyntaxType.LessThanToken,
            SyntaxType.EqualsToken
        ];

        const got = [];
        let token = lexer.scan();

        while (token != SyntaxType.EndOfFileToken) {
            got.push(token);
            token = lexer.scan();
        }

        assert.deepEqual(got, wanted);
    });

    it('tokenizes strings correctly', () => {
        const lexer = new Lexer(SyntaxTarget.PROTO3, true, (err: string) => { }, `"hello" "\\u05D0\\u{1D306}\\t\\n\\v\\b\\f\\r\\"\\'\\0"`);

        const first = lexer.scan();
        const firstValue = lexer.getTokenValue();

        const second = lexer.scan();
        const secondValue = lexer.getTokenValue();

        assert.equal(firstValue, 'hello');
        assert.equal(secondValue, 'א𝌆\t\n\v\b\f\r\"\'\0');
    });

    it('provides token under cursor', () => {
        const lexer = new Lexer(SyntaxTarget.PROTO3, true, (err: string) => { }, `option test.value = "35";`);

        lexer.scan();
        const token = lexer.getToken();

        assert.equal(token, SyntaxType.OptionKeyword);
    });

    it('provides text position under cursor', () => {
        const lexer = new Lexer(SyntaxTarget.PROTO3, true, (err: string) => { }, `option test.value = "35";`);

        lexer.scan();
        const position = lexer.getTextPosition();

        assert.equal(position, 6);
    });

    it('indicates whether scanned line was preceded by line break', () => {
        const lexer = new Lexer(SyntaxTarget.PROTO3, true, (err: string) => { }, `
            option test.sample = "hello";
            option test.value = 35;
        `);

        for (let i = 0; i < 8; i++) {
            lexer.scan();
        }

        assert.isTrue(lexer.hasPrecedingLineBreak());
    });

    it('indicates whether a scanned token is unterminated', () => {
        const first = `"hello`;
        const lexer = new Lexer(SyntaxTarget.PROTO3, true, (err: string) => { }, `
            option test.sample = "hello
            there";
        `);

        for (let i = 0; i < 6; i++) {
            lexer.scan();
        }

        assert.isTrue(lexer.isUnterminated());
    });

    it('tokenizes new line trivia correctly', () => {
        const lexer = new Lexer(SyntaxTarget.PROTO3, false, (err: string) => { }, `\n`);

        const type = lexer.scan();
        assert.equal(type, SyntaxType.NewLineTrivia);
    });

    it('tokenizes whitespace trivia correctly', () => {
        const lexer = new Lexer(SyntaxTarget.PROTO3, false, (err: string) => { }, `\t\v\f `);

        const type = lexer.scan();
        assert.equal(type, SyntaxType.WhitespaceTrivia);
    });

    it('tokenizes comment trivia correctly', () => {
        const lexer = new Lexer(SyntaxTarget.PROTO3, false, (err: string) => { }, `
            // This is a single line comment.
            /*
             * This is a multiline comment.
             */
        `);

        // Scan the leading newline and tab.
        lexer.scan();
        lexer.scan();

        const first = lexer.scan();
        assert.equal(first, SyntaxType.SingleLineCommentTrivia);

        // Scan the interceding newline and tab.
        lexer.scan();
        lexer.scan();

        const second = lexer.scan();
        assert.equal(second, SyntaxType.MultiLineCommentTrivia);
    });

    it('properly handles CRLF line endings', () => {
        const lexer = new Lexer(SyntaxTarget.PROTO3, false, (err: string) => { }, `\r\n`);

        const type = lexer.scan();
        assert.equal(type, SyntaxType.NewLineTrivia);
    });

    it('handles unterminated block comments', () => {
        const lexer = new Lexer(SyntaxTarget.PROTO3, false, (err: string) => {
            assert.equal(err, 'expected block comment close');
        }, `/* This is a block comment`);

        lexer.scan();
    });

    it('skips comment trivia correctly', () => {
        const lexer = new Lexer(SyntaxTarget.PROTO3, true, (err: string) => { }, `
            // This is a single line comment.
            /* This is a block comment. */
            "hello"
        `);

        const type = lexer.scan();
        assert.equal(type, SyntaxType.StringLiteral);
    });

    it('handles miscellaneous whitespace and line break characters', () => {
        const lexer = new Lexer(SyntaxTarget.PROTO3, true, (err: string) => { }, `\u00a0\u2029`);

        const first = lexer.scan();
        assert.equal(first, SyntaxType.EndOfFileToken);
        assert.isTrue(lexer.hasPrecedingLineBreak());
    });

    it('handles unknown characters', () => {
        const lexer = new Lexer(SyntaxTarget.PROTO3, true, (err: string) => {
            assert.equal(err, 'invalid character');
        }, `ᚙ`);

        const type = lexer.scan();
        assert.equal(type, SyntaxType.Unknown);
    });

    it('handles unterminated string literals', () => {
       const lexer = new Lexer(SyntaxTarget.PROTO3, true, (err: string) => { 
           assert.equal(err, 'unterminated string literal');
       }, `"hello`);

       const type = lexer.scan();
       assert.equal(type, SyntaxType.StringLiteral);
       assert.isTrue(lexer.isUnterminated());
    });
});