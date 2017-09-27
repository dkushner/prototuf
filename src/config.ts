import * as fs from 'fs';
import * as path from 'path';

import { RuleSeverity, Options } from './rule';

export interface Configuration {
    defaultSeverity?: RuleSeverity;
    extends: string[];

    rulesDirectory: string[];
    rules: Map<string, Partial<Options>>;
}

export const CONFIG_FILENAME = 'prototuf.json';
export const DEFAULT_CONFIG: Configuration = {
    defaultSeverity: 'error',
    extends: ['core:common'],
    rules: new Map<string, Partial<Options>>(),
    rulesDirectory: []
};

export const EMPTY_CONFIG: Configuration = {
    defaultSeverity: 'error',
    extends: [],
    rules: new Map<string, Partial<Options>>(),
    rulesDirectory: []
};

const BUILT_IN_CONFIG = /^core:(.*)$/;