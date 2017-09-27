import {} from 'jest';
import { assert } from 'chai';
import { Parser } from '../src/parser';
import {
    MessageDefinition, EnumDefinition, EnumFieldStatement,
    OneofStatement, MapFieldStatement, SyntaxType, TypeReference,
    ServiceDefinition, RPCStatement, ImportStatement, OptionStatement,
    FloatLiteral
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

    it('parses an empty statement correctly', () => {
        const sample = `
            syntax = "proto3";
            ;
        `;

        const parser = new Parser(sample);
        const sourceFile = parser.parseSourceFile('test.proto');

        assert.lengthOf(sourceFile.statements, 1);

        const statement = sourceFile.statements[0];
        assert.equal(statement.kind, SyntaxType.EmptyStatement);
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

    it('parses message definitions correctly', () => {
        const sample = dedent`
            syntax = "proto3";

            message TestMessage {
                option test = 0x34;

                enum Status {
                    PASS = 0;
                    FAIL = 1;
                }

                message Nested {
                    string bird = 1;
                }

                repeated int32 numbers = 1;
                string word = 2;
                ;
            }
        `;

        const parser = new Parser(sample);
        const sourceFile = parser.parseSourceFile('test.proto');

        assert.lengthOf(sourceFile.statements, 1);

        const definition = sourceFile.statements[0] as MessageDefinition;
        const span = sample.substring(definition.start, definition.end);
        assert.equal(span, dedent`
            message TestMessage {
                option test = 0x34;

                enum Status {
                    PASS = 0;
                    FAIL = 1;
                }

                message Nested {
                    string bird = 1;
                }

                repeated int32 numbers = 1;
                string word = 2;
                ;
            }
        `);

        const types = [
            SyntaxType.OptionStatement,
            SyntaxType.EnumDefinition,
            SyntaxType.MessageDefinition,
            SyntaxType.FieldStatement,
            SyntaxType.FieldStatement,
            SyntaxType.EmptyStatement
        ];

        types.forEach((type, index) => {
            assert.equal(definition.body[index].kind, type);
        });
    });

    it('parses enum definitions correctly', () => {
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
                map<int64, .some.package.Value> map = 1;
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
        assert.equal(mapSpan, `map<int64, .some.package.Value> map = 1;`);
    });

    it('parses oneof field statements correctly', () => {
        const sample = dedent`
            syntax = "proto3";

            message TestMessage {
                oneof test {
                    string word = 1;
                    TestMessage test = 2;
                    ;
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
        assert.lengthOf(oneof.fields, 3);
        assert.equal(oneof.name.text, 'test');
        assert.equal(dedent(oneofSpan), dedent`
            oneof test {
                string word = 1;
                TestMessage test = 2;
                ;
            }
        `);

        const firstField = oneof.fields[0];
        const firstSpan = sample.substring(firstField.start, firstField.end);
        assert.equal(firstSpan, `string word = 1;`);

        const secondField = oneof.fields[1];
        const secondSpan = sample.substring(secondField.start, secondField.end);
        assert.equal(secondSpan, `TestMessage test = 2;`);
    });

    it('parses service definitions correctly', () => {
        const sample = dedent`
            syntax = "proto3";

            service TestService {
                option service.option = true;
                rpc TestMethod (TestRequest) returns (TestResponse);
                ;
            }
        `;

        const parser = new Parser(sample);
        const sourceFile = parser.parseSourceFile('test.proto');

        assert.lengthOf(sourceFile.statements, 1);

        const definition = sourceFile.statements[0] as ServiceDefinition;
        const span = sample.substring(definition.start, definition.end);
        assert.equal(span, dedent`
            service TestService {
                option service.option = true;
                rpc TestMethod (TestRequest) returns (TestResponse);
                ;
            }
        `);

        const types = [
            SyntaxType.OptionStatement,
            SyntaxType.RPCStatement,
            SyntaxType.EmptyStatement
        ];

        types.forEach((type, index) => {
            assert.equal(definition.body[index].kind, type);
        });
    });

    it('parses RPC method definitions correctly', () => {
        const sample = dedent`
            syntax = "proto3";

            service TestService {
                rpc TestMethod (stream TestRequest) returns (stream TestResponse) {
                    option method.option = 034;
                    ;
                }
            }
        `;

        const parser = new Parser(sample);
        const sourceFile = parser.parseSourceFile('test.proto');

        const definition = (sourceFile.statements[0] as ServiceDefinition).body[0] as RPCStatement;
        const span = sample.substring(definition.start, definition.end);

        assert.equal(dedent(span), dedent`
                rpc TestMethod (stream TestRequest) returns (stream TestResponse) {
                    option method.option = 034;
                    ;
                }
        `);

        const types = [
            SyntaxType.OptionStatement,
            SyntaxType.EmptyStatement
        ];

        types.forEach((type, index) => {
            assert.equal(definition.body[index].kind, type);
        });
    });

    it('parses import statements correctly', () => {
        const sample = `
            syntax = "proto3";

            import "test/file.proto";
            import weak "test/other.proto";
            import public "test/public.proto";
        `;

        const parser = new Parser(sample);
        const sourceFile = parser.parseSourceFile('test.proto');

        assert.lengthOf(sourceFile.statements, 3);

        const first = (sourceFile.statements[0] as ImportStatement);
        assert.equal(first.kind, SyntaxType.ImportStatement);
        assert.isUndefined(first.modifiers);

        const second = (sourceFile.statements[1] as ImportStatement);
        assert.equal(second.kind, SyntaxType.ImportStatement);
        assert.lengthOf(second.modifiers, 1);
        assert.equal(second.modifiers[0].kind, SyntaxType.WeakKeyword);

        const third = (sourceFile.statements[2] as ImportStatement);
        assert.equal(third.kind, SyntaxType.ImportStatement);
        assert.lengthOf(third.modifiers, 1);
        assert.equal(third.modifiers[0].kind, SyntaxType.PublicKeyword);
    });

    it('parses constant values correctly', () => {
        const sample = `
            syntax = "proto3";

            option some.value = -10.3e4;
        `;

        const parser = new Parser(sample);
        const sourceFile = parser.parseSourceFile('test.proto');

        const statement = sourceFile.statements[0] as OptionStatement;
        assert.equal(statement.value.kind, SyntaxType.FloatLiteral);

        const value = statement.value as FloatLiteral;
        assert.equal(value.text, '10.3e4');
    });
});