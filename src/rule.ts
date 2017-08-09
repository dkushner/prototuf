import * as pb from 'protobufjs';
import * as _ from 'lodash';

export interface IRuleConstructor {
    metadata: IRuleMetadata;
    new(options: IOptions): IRule;
}

export interface IRuleMetadata {
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

export type RuleType = 'maintainability' | 'style';

export type RuleSeverity = 'warning' | 'error' | 'off';

export interface IOptions {
    ruleArguments: any[];
    ruleSeverity: RuleSeverity;
    ruleName: string;
}

export interface IRule {
    getOptions(): IOptions;
    isEnabled(): boolean;

    apply(project: pb.Root): RuleFailure[];
    applyWithWalker(walker: IWalker): RuleFailure[];
}

export interface ReplacementJson {
    innerStart: number;
    innerLength: number;
    innerText: string;
}

export type Fix = Replacement | Replacement[];
export type FixJson = ReplacementJson | ReplacementJson[];

export interface IRuleFailurePositionJson {
    character: number;
    line: number;
    position: number;
}

export class RuleFailurePosition {
    constructor(private position: number, private location: Location) {
    }

    public getPosition() {
        return this.position;
    }

    public getLineAndCharacter() {
        return this.location;
    }

    public toJson(): IRuleFailurePositionJson {
        return {
            character: this.location.character,
            line: this.location.line,
            position: this.position,
        };
    }

    public equals(ruleFailurePosition: RuleFailurePosition) {
        const ll = this.lineAndCharacter;
        const rr = ruleFailurePosition.lineAndCharacter;

        return this.position === ruleFailurePosition.position
            && ll.line === rr.line
            && ll.character === rr.character;
    }
}

export class RuleFailure {
    private fileName: string;
    private startPosition: RuleFailurePosition;
    private endPosition: RuleFailurePosition;
    private rawLines: string;
    private ruleSeverity: RuleSeverity;

    constructor(private sourceFile: ts.SourceFile,
                start: number,
                end: number,
                private failure: string,
                private ruleName: string,
                private fix?: Fix) {

        this.fileName = sourceFile.fileName;
        this.startPosition = this.createFailurePosition(start);
        this.endPosition = this.createFailurePosition(end);
        this.rawLines = sourceFile.text;
        this.ruleSeverity = 'error';
    }

    public getFileName() {
        return this.fileName;
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

    public hasFix() {
        return this.fix !== undefined;
    }

    public getFix() {
        return this.fix;
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

    public toJson(): IRuleFailureJson {
        return {
            endPosition: this.endPosition.toJson(),
            failure: this.failure,
            fix: this.fix === undefined ? undefined : Array.isArray(this.fix) ? this.fix.map((r) => r.toJson()) : this.fix.toJson(),
            name: this.fileName,
            ruleName: this.ruleName,
            ruleSeverity: this.ruleSeverity.toUpperCase(),
            startPosition: this.startPosition.toJson(),
        };
    }

    public equals(ruleFailure: RuleFailure) {
        return this.failure  === ruleFailure.getFailure()
            && this.fileName === ruleFailure.getFileName()
            && this.startPosition.equals(ruleFailure.getStartPosition())
            && this.endPosition.equals(ruleFailure.getEndPosition());
    }

    private createFailurePosition(position: number) {
        const lineAndCharacter = this.sourceFile.getLineAndCharacterOfPosition(position);
        return new RuleFailurePosition(position, lineAndCharacter);
    }
}

export class Replacement {
    public static applyFixes(content: string, fixes: Fix[]): string {
        return this.applyAll(content, _.flatMap(fixes, (fix) => fix ? _.castArray(fix) : []));
    }

    public static applyAll(content: string, replacements: Replacement[]) {
        // sort in reverse so that diffs are properly applied
        replacements.sort((a, b) => b.end !== a.end ? b.end - a.end : b.start - a.start);
        return replacements.reduce((text, r) => r.apply(text), content);
    }

    public static replaceNode(node: ts.Node, text: string, sourceFile?: ts.SourceFile): Replacement {
        return this.replaceFromTo(node.getStart(sourceFile), node.getEnd(), text);
    }

    public static replaceFromTo(start: number, end: number, text: string) {
        return new Replacement(start, end - start, text);
    }

    public static deleteText(start: number, length: number) {
        return new Replacement(start, length, '');
    }

    public static deleteFromTo(start: number, end: number) {
        return new Replacement(start, end - start, '');
    }

    public static appendText(start: number, text: string) {
        return new Replacement(start, 0, text);
    }

    constructor(readonly start: number, readonly length: number, readonly text: string) {}

    get end() {
        return this.start + this.length;
    }

    public apply(content: string) {
        return content.substring(0, this.start) + this.text + content.substring(this.start + this.length);
    }

    public toJson(): ReplacementJson {
        return {
            innerStart: this.start,
            innerLength: this.length,
            innerText: this.text,
        };
    }
}