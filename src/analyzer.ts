import { RuleFailure } from './rule';
import { FormatterConstructor } from './formatter';
import { Project } from './project';
import { Parser } from './parser';

/**
 * Result of a single analyzer run.
 */
export interface AnalyzerResult {
    /** Number of errors generated by active rules. */
    errorCount: number;
    /** Number of warnings generated by active rules. */
    warningCount: number;
    /** Set of rule failures generated by active rules. */
    failures: RuleFailure[];
    /** Format to use for rendering results. */
    format: string | FormatterConstructor;
    /** Rendered output as a string. */
    output: string;
}

/**
 * Configuration options for the analyzer.
 */
export interface AnalyzerOptions {
    /**
     * The format to use to render the results.
     */
    formatter?: string | FormatterConstructor;
    /**
     * Where to locate the indicated formatter.
     */
    formattersDirectory?: string;
    /**
     * Where to locate additional rules for analysis.
     */
    rulesDirectory?: string;
}

/**
 * Evaluates a set of rules against a given codebase.
 */
export class Analyzer {
    private options: AnalyzerOptions;

    private project?: Project;

    private failures: RuleFailure[] = [];
    private fixes: RuleFailure[] = [];

    constructor(options: AnalyzerOptions, project?: Project) {
        this.options = options;
        this.project = project;
    }

    private analyze(fileName: string, source: string) {
        console.log(fileName, source);
    }


    private getSourceFile(fileName: string, source: string) {
        if (this.project) {
            const sourceFile = this.project.getSourceFile(fileName);
            if (!sourceFile) {
                throw new Error(`invalid source file ${fileName}`);
            }
            return sourceFile;
        }

        const parser = new Parser(source);
        return parser.parseSourceFile(fileName);
    }
}