import * as _ from 'lodash';

import { SourceFile } from './language';
import { Walker } from './walker';

/**
 * Describes a rule implementation annotated with metadata.
 */
export interface RuleConstructor {
    metadata: RuleMetadata;
    new(options: Options): Rule;
}

/**
 * Information regarding a rule definition.
 */
export interface RuleMetadata {
    ruleName: string;
    type: RuleType;
    deprecationMessage?: string;
    description: string;
    descriptionDetails: string;

    hasFix?: boolean;
    optionsDescription: string;
    options: any;

    optionExamples?: Array<true | any[]> | string[];

    rationale?: string;
}

/**
 * Dscribes the general purpose of a rule.
 * Correctness describes a rule that is necessary to maintain conformity with language specifications.
 * Maintainability describes a rule that helps keep code clean and readable.
 * Style indicates a rule that enforces opinionated guidelines or conformity to organizational standards.
 */
export type RuleType = 'correctness' | 'maintainability' | 'style';

export type RuleSeverity = 'warning' | 'error' | 'off';

export interface Options {
    ruleArguments: any[];
    ruleSeverity: RuleSeverity;
    ruleName: string;
}

export interface Rule {
    getOptions(): Options;
    isEnabled(): boolean;

    apply(project: SourceFile): RuleFailure[];
    applyWithWalker(walker: Walker): RuleFailure[];
}

export interface ReplacementJson {
    innerStart: number;
    innerLength: number;
    innerText: string;
}

export class RuleFailurePosition {
    constructor(private position: number, private location: Location) {
    }

    public getPosition() {
        return this.position;
    }

    public getLocation() {
        return this.location;
    }
}

export class RuleFailure {
    private sourceFile: SourceFile;
    private startPosition: RuleFailurePosition;
    private endPosition: RuleFailurePosition;
    private rawLines: string;
    private ruleSeverity: RuleSeverity;
    private failure: string;
    private ruleName: string;

    constructor(sourceFile: SourceFile, start: number, end: number, failure: string, ruleName: string) {
        this.sourceFile = sourceFile;
        this.rawLines = sourceFile.text;
        this.ruleSeverity = 'error';
    }

    public getFileName() {
        return this.sourceFile.fileName;
    }

    public getRuleName() {
        return this.ruleName;
    }

    public getStartPosition(): RuleFailurePosition {
        return this.startPosition;
    }

    public getEndPosition(): RuleFailurePosition {
        return this.endPosition;
    }

    public getFailure() {
        return this.failure;
    }

    public getRawLines() {
        return this.rawLines;
    }

    public getRuleSeverity() {
        return this.ruleSeverity;
    }

    public setRuleSeverity(value: RuleSeverity) {
        this.ruleSeverity = value;
    }
}