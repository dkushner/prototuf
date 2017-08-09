import {} from 'jest';
import * as pb from 'protobufjs';
import * as path from 'path';
import * as fs from 'fs';
import { inspect } from 'util';

describe('analyzer', () => {
    it('exists', () => {
        return pb.load(path.join(__dirname, './sample.proto')).then(root => {
            console.log(inspect(root, { depth: 10 }));
        });
    });

    it('tokenizes', () => {
        const tokens = pb.tokenize(fs.readFileSync(path.join(__dirname, './sample.proto'), {
            encoding: 'utf8'
        }));

        let token = tokens.next();
        while (token) {
            console.log(inspect(token, { depth: 5 }), tokens.line);
            token = tokens.next();
        }
    });
});
