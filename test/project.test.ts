import {} from 'jest';
import { assert } from 'chai';
import {} from 'glob';
import * as glob from 'glob';
import * as path from 'path';
import { Project } from '../src/project';
import * as dedent from 'dedent';

describe('project', () => {
    it('works', () => {
        const files = glob.sync(path.resolve(__dirname, 'samples/**/*.proto'));
        const includes = [path.resolve(__dirname, 'samples')];
        const project = new Project(files, includes);
    });
});