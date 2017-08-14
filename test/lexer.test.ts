import {} from 'jest';
import * as pb from 'protobufjs';
import * as path from 'path';
import * as fs from 'fs';
import { assert } from 'chai';
import Lexer, { SyntaxTarget } from '../src/lexer';
import { SyntaxType } from '../src/language';
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
        const lexer = new Lexer(SyntaxTarget.PROTO3, true, (err: string) => { }, '0xDEADBEEF 0XCAFEBABE');

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
});