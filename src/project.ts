import * as path from 'path';
import * as fs from 'fs';
import { SourceFile } from './language';
import Parser from './parser';

/**
 * A project represents collection of protobuf source files and include
 * directories that comprise a single compilation environment.
 */
export default class Project {
    private commonRoot: string;

    /**
     * List of file names included via imports.
     */
    private includedSources: string[];
    /**
     * List of file names included in the project.
     */
    private projectSources: string[];

    private filesByName: Map<string, SourceFile>;

    /**
     * Creates a new project instance.
     *
     * We begin by first finding the common root among the given source files.
     * This becomes the 'project root' relative to which all further path refernces
     * are first checked.
     * @param  {string[]} files project source file paths
     * @param  {string[]} includes include directories to resolve dependencies
     */
    constructor(files: string[], includes: string[]) {
        const resolved = files.map((filePath) => path.resolve(filePath));
        this.commonRoot = this.findCommonRoot(resolved);

        this.filesByName = new Map(files.map((file): [string, SourceFile] => {
            const text = fs.readFileSync(file, { encoding: 'utf8' });
            const parser = new Parser(text);
            return [file, parser.parseSourceFile(file)];
        }));
    }

    private findCommonRoot(files: string[]): string {
        return files.reduce((common, file) => {
            let end = 0;
            while (common[end] === file[end] && common[end] !== undefined) {
                end++;
            }

            if (!end) {
                throw new Error(`project files do not share a common root`);
            }

            return common.substring(0, end);
        }, files[0]);
    }

    public getSourceFiles(): SourceFile[] {
        return Array.from(this.filesByName.values());
    }

    public getProjectSourceFiles(): SourceFile[] {
        return this.projectSources.map((fileName) => {
            return this.filesByName.get(fileName);
        });
    }

    public getIncludedSourceFiles(): SourceFile[] {
        return this.includedSources.map((fileName) => {
            return this.filesByName.get(fileName);
        });
    }

    public getSourceFile(filePath: string): SourceFile {
        const existing = this.filesByName.get(filePath);
        if (existing) {
            return existing;
        }

        const text = fs.readFileSync(filePath, { encoding: 'utf8' });
        const parser = new Parser(text);

        const parsed = parser.parseSourceFile(filePath);
        this.filesByName.set(filePath, parsed);
        return parsed;
    }
}