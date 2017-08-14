import * as pb from 'protobufjs';
import { RuleFailure } from './rule';
import { Project } from './language';
import * as path from 'path';

export interface AnalyzerResult {
    errorCount: number;
    warningCount: number;
    failures: RuleFailure[];
    fixes?: RuleFailure[];
    format: string | FormatterConstructor;
    output: string;
}

export interface AnalyzerOptions {
    fix: boolean;
    formatter?: string | FormatterConstructor;
    formattersDirectory?: string;
    rulesDirectory?: string;
}

export default class Analyzer {

    private failures: RuleFailure[] = [];
    private fixes: RuleFailure[] = [];

    constructor(options: AnalyzerOptions, project?: Project) {

    }
}