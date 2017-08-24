import {} from 'jest';
import { assert } from 'chai';
import Parser from '../src/parser';
import {
    MessageDefinition, EnumDefinition, EnumFieldStatement,
    OneofStatement, MapFieldStatement, SyntaxType, TypeReference
} from '../src/language';
import * as dedent from 'dedent';

describe('parser', () => {
    it('parses source files correctly', () => {
        const sample = `
            syntax = "proto3";
        `;

        const parser = new Parser(sample);
        const sourceFile = parser.parseSourceFile('test.proto');
        assert.equal(sourceFile.fileName, 'test.proto');
        assert.equal(sourceFile.syntax.version.text, 'proto3');

        const span = sample.substring(sourceFile.syntax.start, sourceFile.syntax.end);
        assert.equal('syntax = "proto3";', span);
    });

    it('parses option statements correctly', () => {
        const sample = `
            syntax = "proto3";
            // Octal value.
            option test_option = 0877;

            // Reserved word after extension.
            option (my.test).option = whatever;
        `;

        const parser = new Parser(sample);
        const sourceFile = parser.parseSourceFile('test.proto');

        assert.lengthOf(sourceFile.statements, 2);

        const firstStatement = sourceFile.statements[0];
        const firstSpan = sample.substring(firstStatement.start, firstStatement.end);
        assert.equal(firstSpan, 'option test_option = 0877;');

        const secondStatement = sourceFile.statements[1];
        const secondSpan = sample.substring(secondStatement.start, secondStatement.end);
        assert.equal(secondSpan, 'option (my.test).option = whatever;');
    });

    it('parses basic message definitions correctly', () => {
        const sample = dedent`
            syntax = "proto3";

            message TestMessage {
                repeated int32 numbers = 1;
                string word = 2;
            }
        `;

        const parser = new Parser(sample);
        const sourceFile = parser.parseSourceFile('test.proto');

        assert.lengthOf(sourceFile.statements, 1);

        const definition = sourceFile.statements[0] as MessageDefinition;
        const span = sample.substring(definition.start, definition.end);
        assert.equal(span, dedent`
            message TestMessage {
                repeated int32 numbers = 1;
                string word = 2;
            }
        `);

        const fieldOne = definition.body[0];
        const fieldOneSpan = sample.substring(fieldOne.start, fieldOne.end);
        assert.equal(fieldOneSpan, `repeated int32 numbers = 1;`);

        const fieldTwo = definition.body[1];
        const fieldTwoSpan = sample.substring(fieldTwo.start, fieldTwo.end);
        assert.equal(fieldTwoSpan, `string word = 2;`);
    });

    it('parses basic enum definitions correctly', () => {
        const sample = dedent`
            syntax = "proto3";

            enum TestEnum {
                UNKNOWN = 0;
                SOME = 1;
                THING = 2;
            }
        `;

        const parser = new Parser(sample);
        const sourceFile = parser.parseSourceFile('test.proto');

        assert.lengthOf(sourceFile.statements, 1);

        const definition = sourceFile.statements[0] as EnumDefinition;
        const span = sample.substring(definition.start, definition.end);
        assert.equal(span, dedent`
            enum TestEnum {
                UNKNOWN = 0;
                SOME = 1;
                THING = 2;
            }
        `);

        assert.lengthOf(definition.body, 3);
        const got = definition.body.map((statement) => {
            return [
                (statement as EnumFieldStatement).name.text,
                (statement as EnumFieldStatement).number.text
            ];
        });

        const expected = [
            ['UNKNOWN', '0'],
            ['SOME', '1'],
            ['THING', '2']
        ];

        assert.deepEqual(got, expected);
    });

    it('parses map field statements correctly', () => {
        const sample = dedent`
            syntax = "proto3";

            message TestMessage {
                map<int64, some.package.Value> map = 1;
            }
        `;

        const parser = new Parser(sample);
        const sourceFile = parser.parseSourceFile('test.proto');
        assert.lengthOf(sourceFile.statements, 1);

        const message = <MessageDefinition>sourceFile.statements[0];
        assert.lengthOf(message.body, 1);

        const map = <MapFieldStatement>message.body[0];
        const mapSpan = sample.substring(map.start, map.end);

        assert.equal(map.name.text, 'map');
        assert.equal(map.key.kind, SyntaxType.Int64Keyword);
        assert.equal((map.type as TypeReference).terminal.text, 'Value');
        assert.equal(mapSpan, `map<int64, some.package.Value> map = 1;`);
    });

    it('parses oneof field statements correctly', () => {
        const sample = dedent`
            syntax = "proto3";

            message TestMessage {
                oneof test {
                    string word = 1;
                    int32 number = 2;
                }
            }
        `;

        const parser = new Parser(sample);
        const sourceFile = parser.parseSourceFile('test.proto');

        assert.lengthOf(sourceFile.statements, 1);

        const message = <MessageDefinition>sourceFile.statements[0];
        assert.lengthOf(message.body, 1);

        const oneof = <OneofStatement>message.body[0];
        const oneofSpan = sample.substring(oneof.start, oneof.end);
        assert.lengthOf(oneof.fields, 2);
        assert.equal(oneof.name.text, 'test');
        assert.equal(dedent(oneofSpan), dedent`
            oneof test {
                string word = 1;
                int32 number = 2;
            }
        `);

        const firstField = oneof.fields[0];
        const firstSpan = sample.substring(firstField.start, firstField.end);
        assert.equal(firstSpan, `string word = 1;`);

        const secondField = oneof.fields[1];
        const secondSpan = sample.substring(secondField.start, secondField.end);
        assert.equal(secondSpan, `int32 number = 2;`);
    });
});