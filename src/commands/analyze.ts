import { Command, command, param, params, Options, option } from 'clime';
import * as path from 'path';

export class AnalyzerOptions extends Options {
    @option({
        flag: 'c',
        description: 'location of the prototuf config file'
    })
    config: string;

    @option({
        flag: 'f',
        description: 'whether or not to apply available fixes to errant rules'
    })
    fix: boolean;

    @option({
        flag: 'p',
        description: 'run the analyzer on a prototuf project directory with a prototuf.json config file'
    })
    project: string;

    @option({
        flag: 'e',
        description: 'glob of files to exclude from any analysis'
    })
    exclude: string;
}

@command({
    description: 'analyzes a protobuf repository and enforces style rules'
})
export default class extends Command {
    execute(
        @params({
            type: String,
            description: 'file paths of proto files to analyze'
        })
        protoFiles: string[],
        @params({
            type: String,
            description: 'files or paths to include in dependency search'
        })
        options: AnalyzerOptions
    ) { }
}