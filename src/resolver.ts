import { Project } from './project';
import { SourceFile, SymbolTable, Symbol } from './language';

export class TypeResolver {
    private project: Project;
    private root: Symbol;

    constructor(project: Project) {
        this.project = project;
    }

    public resolve() {
    }

    public resolveFile(sourceFile: SourceFile) {

    }

    public getSymbolFromQualifiedName(name: string): Symbol {
        return undefined;
    }

    public getFullyQualifiedName(symbol: Symbol): string {
        if (!symbol.parent) {
            return '.' + symbol.name;
        } else {
            return symbol.parent + '.' + symbol.name;
        }
    }

    public getNodeCount(): number {
        return this.project.getSourceFiles().reduce((sum, file) => {
            return sum + file.nodeCount;
        }, 0);
    }

    public getIdentifierCount(): number {
        return this.project.getSourceFiles().reduce((sum, file) => {
            return sum + file.identifierCount;
        }, 0);
    }
}