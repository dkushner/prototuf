import { RuleFailure } from './rule';

export interface FormatterMetadata {
    formatterName: string;
    description: string;
    descriptionDetails?: string;
    sample: string;
    consumer: ConsumerType;
}

export type ConsumerType = 'human' | 'machine';

export interface FormatterConstructor {
    new(): Formatter;
}

export interface Formatter {
    format(failures: RuleFailure[], fixes?: RuleFailure[]): string;
}