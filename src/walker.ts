import { SyntaxType, SourceFile, Node } from './language';
import { PackageStatement, Identifier } from './language';
import { RuleFailure } from './rule';
import { forEachChild } from './utils';
import { Options } from './rule';

export interface Walker {
    getSourceFile(): SourceFile;
    walk(sourceFile: SourceFile): void;
    getFailures(): RuleFailure[];
}

export class WalkContext<T> {
    public readonly failures: RuleFailure[];
    public readonly sourceFile: SourceFile;
    public readonly ruleName: string;
    public readonly options: T;

    constructor(sourceFile: SourceFile, ruleName: string, options: T) {
        this.sourceFile = sourceFile;
        this.ruleName = ruleName;
        this.options = options;
    }

    public addFailure(start: number, end: number, message: string) {
        const fileLength = this.sourceFile.end;
        const failure = new RuleFailure(this.sourceFile, Math.min(start, fileLength), Math.min(end, fileLength), message, this.ruleName);
        this.failures.push(failure);
    }

    public addFailureForNode(node: Node, message: string) {
        this.addFailure(node.start, node.end, message);
    }
}

export abstract class AbstractWalker<T> extends WalkContext<T> implements Walker {
    public abstract walk(sourceFile: SourceFile): void;

    public getSourceFile() {
        return this.sourceFile;
    }

    public getFailures() {
        return this.failures;
    }
}

export class SyntaxWalker {
    public walk(node: Node) {
        this.visitNode(node);
    }

    protected walkChildren(node: Node) {
        forEachChild(node, (node) => this.walk(node));
    }

    protected visitKeyword(node: Node) {
        this.walkChildren(node);
    }

    protected visitPackageStatement(node: PackageStatement) {
        this.walkChildren(node);
    }

    protected visitIdentifier(node: Identifier) {
        this.walkChildren(node);
    }

    protected visitNode(node: Node) {
        switch (node.kind) {
            case SyntaxType.PackageStatement:
                this.visitPackageStatement(node as PackageStatement);
            case SyntaxType.
        }
    }
}

export class RuleWalker extends SyntaxWalker implements Walker {
    private limit: number;
    private options?: any[];
    private failures: RuleFailure[];
    private ruleName: string;
    private sourceFile: SourceFile;

    constructor(sourceFile: SourceFile, options: Options) {
        super();

        this.sourceFile = sourceFile;
        this.failures = [];
    }

    public getSourceFile(): SourceFile {
        return this.sourceFile;
    }

    public getFailures(): RuleFailure[] {
        return this.failures;
    }
}