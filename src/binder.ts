import { Project } from './project';
import { SourceFile, Symbol, SymbolType, SymbolTable } from './language';
import { FullIdentifier, Identifier, SyntaxType, MessageDefinition, MessageBodyStatement } from './language';
import { EnumDefinition, EnumBodyStatement, EnumFieldStatement } from './language';

export default class Binder {
    private project: Project;

    private root: Symbol;
    private nextSymbolId = 1;

    constructor(project: Project) {
        this.project = project;
        this.root = this.createSymbol(SymbolType.Package, '<ROOT>');
    }

    private createSymbol(type: SymbolType, name: string, parent?: Symbol): Symbol {
        const symbol = <Symbol>{
            id: this.nextSymbolId++,
            name: name,
            type: type,
            parent: parent,
            members: this.hasMembers(type) ? new Map<string, Symbol>() : undefined
        };

        if (parent) {
            parent.members.set(name, symbol);
        }

        return symbol;
    }

    private hasMembers(type: SymbolType): boolean {
        if (type === SymbolType.Enum || type === SymbolType.Message || type === SymbolType.Service || type === SymbolType.Package) {
            return true;
        }
        return false;
    }

    public bindSourceFile(sourceFile: SourceFile) {
        let currentScope = this.root;

        if (sourceFile.package) {
            currentScope = this.declarePackage(sourceFile.package.name);
        }

        for (const statement of sourceFile.statements) {
            switch (statement.kind) {
                case SyntaxType.MessageDefinition:
                    this.bindMessageDefinition(currentScope, <MessageDefinition>statement);
                    break;
                case SyntaxType.EnumDefinition:
                    this.bindEnumDefinition(currentScope, <EnumDefinition>statement);
                default:
                     break;
            }
        }
    }

    private bindMessageBodyStatement(scope: Symbol, statement: MessageBodyStatement) {
        switch (statement.kind) {
            case SyntaxType.OptionStatement:
                break;
            case SyntaxType.MessageDefinition:
                this.bindMessageDefinition(scope, statement);
                break;
            case SyntaxType.EnumDefinition:
                this.bindEnumDefinition(scope, statement);
                break;
            default:
                break;
        }
    }

    private bindEnumBodyStatement(scope: Symbol, statement: EnumBodyStatement) {
        switch (statement.kind) {
            case SyntaxType.EnumFieldStatement:
                this.bindEnumFieldStatement(scope, statement);
            default:
                break;
        }
    }

    private bindEnumFieldStatement(scope: Symbol, definition: EnumFieldStatement) {
        const name = definition.name.text;

        if (scope.members.has(name)) {
            throw new Error(`Symbol ${name} has already been defined in ${scope.name}.`);
        }

        const enumFieldSymbol = this.createSymbol(SymbolType.EnumField, name, scope);
        definition.symbol = enumFieldSymbol;
    }

    private bindEnumDefinition(scope: Symbol, definition: EnumDefinition) {
        const name = definition.name.text;

        if (scope.members.has(name)) {
            throw new Error(`Symbol ${name} has already been defined in ${scope.name}.`);
        }

        const enumSymbol = this.createSymbol(SymbolType.Enum, name, scope);
        definition.symbol = enumSymbol;
        definition.body.forEach(statement => this.bindEnumBodyStatement(enumSymbol, statement));
    }

    private bindMessageDefinition(scope: Symbol, definition: MessageDefinition) {
        const name = definition.name.text;

        if (scope.members.has(name)) {
            throw new Error(`Symbol ${name} has already been defined in ${scope.name}.`);
        }

        const messageSymbol = this.createSymbol(SymbolType.Message, name, scope);
        definition.symbol = messageSymbol;
        definition.body.forEach(statement => this.bindMessageBodyStatement(messageSymbol, statement));
    }

    /**
     * Declares a package symbol.
     * @param identifier identifier of the package as it appears
     */
    private declarePackage(identifier: FullIdentifier): Symbol {
        let currentScope = this.root;
        for (const ident of identifier.qualifiers) {
            const existing = currentScope.members.get(ident.text);
            if (!existing) {
                currentScope = this.createSymbol(SymbolType.Package, ident.text, currentScope);
            } else {
                currentScope = existing;
            }
        }

        return currentScope.members.get(identifier.terminal.text) || this.createSymbol(SymbolType.Package, identifier.terminal.text, currentScope);
    }

    private resolveSymbolByIdentifier(scope: Symbol, identifier: FullIdentifier): Symbol {
        const isRootRelative = !!identifier.modifiers;

        let currentScope = isRootRelative ? this.root : scope;

        for (const ident of identifier.qualifiers) {
            if (!currentScope.members) {
                return undefined;
            }

            currentScope = currentScope.members.get(ident.text);
            if (!currentScope) {
                return undefined;
            }
        }

        return currentScope.members ? currentScope.members.get(identifier.terminal.text) : undefined;
    }
}