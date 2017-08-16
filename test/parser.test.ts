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

    it('parses top level definitions correctly', () => {
        const sample = `
            syntax = "proto3";

            message TestMessage {
                option my_message = 0877;

                enum TestEnum {
                    UNKNOWN = 0,
                    PASS = 1,
                    FAIL = 2
                }
            }

            enum OtherEnum {
                UNKNOWN = 0,
                FOO = 1,
                BAR = 2
            }
        `;

        const parser = new Parser(sample);
        const sourceFile = parser.parseSourceFile('test.proto');
        console.log(sourceFile);
    });
});