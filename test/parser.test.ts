import {} from 'jest';
import { assert } from 'chai';
import Parser from '../src/parser';

describe('parser', () => {
    it('parses syntax declaration correctly', () => {
        const sample = `
            syntax = "proto3";
        `;

        const parser = new Parser('test.proto', sample);
        const sourceFile = parser.parse();
        console.log(sourceFile);
    });
});