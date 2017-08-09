import { Command, command, param } from 'clime';
import * as path from 'path';

import * as protobuf from 'protobufjs';

@command({
    description: 'analyzes a protobuf repository and enforces style rules'
})
export default class extends Command {
    execute(
        @param({
            name: 'config',
            type: String,
            description: 'location of the prototuf config file'
        })
        configPath: string
    ) { }
}
