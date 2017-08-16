import {} from 'jest';
import { assert } from 'chai';
import Parser from '../src/parser';

describe('parser', () => {
    it('parses source files correctly', () => {
        const sample = `
            syntax = "proto3";
        `;

        const parser = new Parser(sample);
        const sourceFile = parser.parseSourceFile('test.proto');
        assert.equal(sourceFile.fileName, 'test.proto');
        assert.equal(sourceFile.syntax.version, 3);

        const span = sample.substring(sourceFile.syntax.start, sourceFile.syntax.end);
        assert.equal('syntax = "proto3";', span);
    });

    it('parses top level statements correctly', () => {
        const sample = `
            syntax = "proto3";
            package whatever.package;

            option (something.my_option) = -1.5e-7;

            message TestMessage {
                option my_message = 0877;

                enum TestEnum {
                    UNKNOWN,
                    PASS,
                    FAIL
                }
            }
        `;

        const parser = new Parser(sample);
        const sourceFile = parser.parseSourceFile('test.proto');
        console.log(sourceFile);
    });
});