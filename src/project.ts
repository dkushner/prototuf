import * as path from 'path';
import { SourceFile } from './language';

/**
 * A project represents collection of protobuf source files and include
 * directories that comprise a single compilation environment.
 */
export default class Project {
    private commonRoot: string;

    private filesByName: Map<string, SourceFile>;

    /**
     * Creates a new project instance.
     *
     * We begin by first finding the common root among the given source files.
     * This becomes the 'project root' relative to which all further path refernces
     * are first checked.
     * @param  {string[]} files project source files
     * @param  {string[]} includes include directories to resolve dependencies
     */
    constructor(files: string[], includes: string[]) {
        for (const file in files) {

        }
    }
}