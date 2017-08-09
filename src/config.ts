import { RuleSeverity } from './rule';
import { FatalError } from './error';
import * as fs from 'fs';
import * as resolve from 'resolve';
import * as path from 'path';

export interface IConfiguration {
    defaultSeverity?: RuleSeverity;
    extends: string[];

    rulesDirectory: string[];
    rules: Map<string, Partial<IOptions>>;
}

export interface IConfigurationLoadResult {
    path?: string;
    results?: IConfiguration;
}

export const CONFIG_FILENAME = 'prototuf.json';

export const DEFAULT_CONFIG: IConfiguration = {
    defaultSeverity: 'error',
    extends: ['core:common'],
    rules: new Map<string, Partial<IOptions>>(),
    rulesDirectory: []
};

export const EMPTY_CONFIG: IConfiguration = {
    defaultSeverity: 'error',
    extends: [],
    rules: new Map<string, Partial<IOptions>>(),
    rulesDirectory: []
};

const BUILT_IN_CONFIG = /^core:(.*)$/;

export function findConfiguration(configFile: string | null, inputFilePath: string): IConfigurationLoadResult {
    const configPath = findConfigurationPath(configFile, inputFilePath);
    const loadResult: IConfigurationLoadResult = { path: configPath };

    try {
        loadResult.results = loadConfigurationFromPath(configPath);
        return loadResult;
    } catch (e) {
        throw new FatalError(`failed to load ${configPath}: ${(e as Error).message}`, e as Error);
    }
}

export function loadConfigurationFromPath(configFilePath?: string, originalPath = configFilePath) {
    if (!configFilePath) {
        return DEFAULT_CONFIG;
    } else {
        const resolvedConfigFilePath = resolveConfigurationPath(configFilePath);
        let rawConfigFile: RawConfigFile;
        if (path.extname(resolvedConfigFilePath) === '.json') {
            const fileContent = stripComments(fs.readFileSync(resolvedConfigFilePath).toString().replace(/^\uFEFF/, ''));
            try {
                rawConfigFile = JSON.parse(fileContent) as RawConfigFile;
            } catch (e) {
                const error = e as Error;
                throw configFilePath === originalPath ? error : new Error(`${error.message} in ${configFilePath}`);
            }
        } else {
            rawConfigFile = require(resolvedConfigFilePath) as RawConfigFile;
            delete (require.cache as { [key: string]: any })[resolvedConfigFilePath];
        }

        const configFileDir = path.dirname(resolvedConfigFilePath);
        const configFile = parseConfigFile(rawConfigFile, configFileDir);

        const configs: IConfiguration[] = configFile.extends.map((name) => {
            const nextConfigFilePath = resolveConfigurationPath(name, configFileDir);
            return loadConfigurationFromPath(nextConfigFilePath, originalPath);
        }).concat([configFile]);

        return configs.reduce(extendConfigurationFile, EMPTY_CONFIG);
    }
}

export function stripComments(content: string): string {
    const regexp: RegExp = /("(?:[^\\\"]*(?:\\.)?)*")|('(?:[^\\\']*(?:\\.)?)*')|(\/\*(?:\r?\n|.)*?\*\/)|(\/{2,}.*?(?:(?:\r?\n)|$))/g;
    const result = content.replace(regexp, (match: string, _m1: string, _m2: string, m3: string, m4: string) => {
        // Only one of m1, m2, m3, m4 matches
        if (m3 !== undefined) {
            // A block comment. Replace with nothing
            return '';
        } else if (m4 !== undefined) {
            // A line comment. If it ends in \r?\n then keep it.
            const length = m4.length;
            if (length > 2 && m4[length - 1] === '\n') {
                return m4[length - 2] === '\r' ? '\r\n' : '\n';
            } else {
                return '';
            }
        } else {
            // We match a string
            return match;
        }
    });
    return result;
}

export function extendConfigurationFile(targetConfig: IConfiguration, nextConfigSource: IConfiguration): IConfiguration {

    function combineProperties<T>(targetProperty: T | undefined, nextProperty: T | undefined): T {
        const combinedProperty: { [key: string]: any } = {};
        add(targetProperty);
        // next config source overwrites the target config object
        add(nextProperty);
        return combinedProperty as T;

        function add(property: T | undefined): void {
            if (property !== undefined) {
                for (const name in property) {
                    if (Object.prototype.hasOwnProperty.call(property, name)) {
                        combinedProperty[name] = property[name];
                    }
                }
            }

        }
    }

    function combineMaps(target: Map<string, Partial<IOptions>>, next: Map<string, Partial<IOptions>>) {
        const combined = new Map<string, Partial<IOptions>>();
        target.forEach((options, ruleName) => {
            combined.set(ruleName, options);
        });
        next.forEach((options, ruleName) => {
            const combinedRule = combined.get(ruleName);
            if (combinedRule) {
                combined.set(ruleName, combineProperties(combinedRule, options));
            } else {
                combined.set(ruleName, options);
            }
        });
        return combined;
    }

    const combinedRulesDirs = targetConfig.rulesDirectory.concat(nextConfigSource.rulesDirectory);
    const dedupedRulesDirs = Array.from(new Set(combinedRulesDirs));

    return {
        extends: [],
        rules: combineMaps(targetConfig.rules, nextConfigSource.rules),
        rulesDirectory: dedupedRulesDirs,
    };
}

export function parseConfigFile(configFile: RawConfigFile, configFileDir?: string): IConfiguration {
    return {
        extends: configFile.extends ? (Array.isArray(configFile.extends) ? configFile.extends : [configFile.extends]) : [],
        rules: parseRules(configFile.rules),
        rulesDirectory: getRulesDirectories(configFile.rulesDirectory, configFileDir),
    };

    function parseRules(config: RawRulesConfig | undefined): Map<string, Partial<IOptions>> {
        const map = new Map<string, Partial<IOptions>>();
        if (config !== undefined) {
            for (const ruleName in config) {
                if (Object.prototype.hasOwnProperty.call(config, ruleName)) {
                   map.set(ruleName, parseRuleOptions(config[ruleName], configFile.defaultSeverity));
                }
            }
        }
        return map;
    }
}

function parseRuleOptions(ruleConfigValue: RawRuleConfig, rawDefaultRuleSeverity: string | undefined): Partial<IOptions> {
    let ruleArguments: any[] | undefined;
    let defaultRuleSeverity: RuleSeverity = 'error';

    if (rawDefaultRuleSeverity !== undefined) {
        switch (rawDefaultRuleSeverity.toLowerCase()) {
            case 'warn':
            case 'warning':
                defaultRuleSeverity = 'warning';
                break;
            case 'off':
            case 'none':
                defaultRuleSeverity = 'off';
                break;
            default:
                defaultRuleSeverity = 'error';
        }
    }

    let ruleSeverity = defaultRuleSeverity;

    if (!ruleConfigValue) {
        ruleArguments = [];
        ruleSeverity = 'off';
    } else if (Array.isArray(ruleConfigValue)) {
        if (ruleConfigValue.length > 0) {
            // old style: array
            ruleArguments = ruleConfigValue.slice(1);
            ruleSeverity = ruleConfigValue[0] === true ? defaultRuleSeverity : 'off';
        }
    } else if (typeof ruleConfigValue === 'boolean') {
        // old style: boolean
        ruleArguments = [];
        ruleSeverity = ruleConfigValue ? defaultRuleSeverity : 'off';
    } else if (typeof ruleConfigValue === 'object') {
        if (ruleConfigValue.severity !== undefined) {
            switch (ruleConfigValue.severity.toLowerCase()) {
                case 'default':
                    ruleSeverity = defaultRuleSeverity;
                    break;
                case 'error':
                    ruleSeverity = 'error';
                    break;
                case 'warn':
                case 'warning':
                    ruleSeverity = 'warning';
                    break;
                case 'off':
                case 'none':
                    ruleSeverity = 'off';
                    break;
                default:
                    console.warn(`Invalid severity level: ${ruleConfigValue.severity}`);
                    ruleSeverity = defaultRuleSeverity;
            }
        }
        if (ruleConfigValue.options != undefined) {
            ruleArguments = ruleConfigValue.options ? (Array.isArray(ruleConfigValue.options) ? ruleConfigValue.options : [ruleConfigValue.options]) : [];
        }
    }

    return {
        ruleArguments,
        ruleSeverity,
    };
}

export function getRelativePath(directory?: string | null, relativeTo?: string) {
    if (directory != undefined) {
        const basePath = relativeTo !== undefined ? relativeTo : process.cwd();
        return path.resolve(basePath, directory);
    }
    return undefined;
}

export function useAsPath(directory: string) {
    return /^(?:\.?\.?(?:\/|$)|node_modules\/)/.test(directory);
}

export function getRulesDirectories(directories?: string | string[], relativeTo?: string): string[] {
    directories = directories ? (Array.isArray(directories) ? directories : [directories]) : [];

    return directories.map((dir) => {
        if (!useAsPath(dir)) {
            try {
                return path.dirname(resolve.sync(dir, { basedir: relativeTo }));
            } catch (err) {
                // swallow error and fallback to using directory as path
            }
        }

        const absolutePath = getRelativePath(dir, relativeTo);
        if (absolutePath != undefined) {
            if (!fs.existsSync(absolutePath)) {
                throw new FatalError(`Could not find custom rule directory: ${dir}`);
            }
        }
        return absolutePath;
    }).filter((dir) => dir !== undefined) as string[];
}

function resolveConfigurationPath(filePath: string, relativeTo?: string) {
    const matches = filePath.match(BUILT_IN_CONFIG);
    const isBuiltInConfig = matches && matches.length > 0;
    if (isBuiltInConfig) {
        const configName = matches![1];
        try {
            return require.resolve(`./configs/${configName}`);
        } catch (err) {
            throw new Error(`${filePath} is not a built-in config, try "tslint:recommended" instead.`);
        }
    }

    const basedir = relativeTo !== undefined ? relativeTo : process.cwd();
    try {
        return resolve.sync(filePath, { basedir });
    } catch (err) {
        try {
            return require.resolve(filePath);
        } catch (err) {
            throw new Error(`invalid extension target: could not find "${filePath}"`);
        }
    }
}

export function findConfigurationPath(supplied: string | null, inputFilePath: string) {
    if (supplied) {
        if (!fs.existsSync(supplied)) {
            throw new FatalError(`failed to find config file in: ${path.resolve(supplied)}`);
        } else {
            return path.resolve(supplied);
        }
    } else {
        let useDirectory = false;
        try {
            const stats = fs.statSync(inputFilePath);
            if (stats.isFile()) {
                useDirectory = true;
            }
        } catch (e) {
            useDirectory = true;
        }

        if (useDirectory) {
            inputFilePath = path.dirname(inputFilePath);
        }

        let configFilePath = scanUp(CONFIG_FILENAME, inputFilePath);
        if (configFilePath !== undefined) {
            return path.resolve(configFilePath);
        }

        const home = getHomeDirectory();
        if (home) {
            configFilePath = path.join(home, CONFIG_FILENAME);
            if (fs.existsSync(configFilePath)) {
                return path.resolve(configFilePath);
            }
        }

        return undefined;
    }
}



function scanUp(filename: string, directory: string): string | undefined {
    while (true) {
        const result = findFile(directory);
        if (result !== undefined) {
            return path.join(directory, result);
        }

        const parent = path.dirname(directory);
        if (parent == directory) {
            return undefined;
        }

        directory = parent;
    }

    function findFile(working: string): string | undefined {
        if (fs.existsSync(path.join(working, filename))) {
            return filename;
        }

        const result = fs.readdirSync(working).find((entry) => entry === filename);
        return result;
    }
}

function getHomeDirectory(): string | undefined {
    const environment = global.process.env as { [key: string]: string };
    const paths: string[] = [
        environment.USERPROFILE,
        environment.HOME,
        environment.HOMEPATH,
        environment.HOMEDRIVE + environment.HOMEPATH
    ];

    for (const home of paths) {
        if (home && fs.existsSync(home)) {
            return home;
        }
    }

    return undefined;
}

export interface RawConfigFile {
    extends?: string | string[];
    rulesDirectory?: string | string[];
    defaultSeverity?: string;
    rules?: RawRulesConfig;
}
export interface RawRulesConfig {
    [key: string]: RawRuleConfig;
}
export type RawRuleConfig = null | undefined | boolean | any[] | {
    severity?: RuleSeverity | 'warn' | 'none' | 'default';
    options?: any;
};
