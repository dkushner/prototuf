import * as pb from 'protobufjs';
import * as path from 'path';

class Analyzer {

    private failures: RuleFailure[] = [];
    private fixes: RuleFailure[] = [];

    public static createProject(configFile: string, projectDirectory: string = path.dirname(configFile)): Project {

    }
}