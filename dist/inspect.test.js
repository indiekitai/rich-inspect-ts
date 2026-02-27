import { describe, it, expect } from 'vitest';
import { inspect, inspectObject } from './inspect.js';
describe('inspectObject', () => {
    it('inspects a plain object', () => {
        const result = inspectObject({ name: 'Alice', age: 30 });
        expect(result.type).toBe('Object');
        expect(result.members).toHaveLength(2);
        expect(result.members[0].name).toBe('age');
        expect(result.members[1].name).toBe('name');
    });
    it('inspects null and undefined', () => {
        expect(inspectObject(null).type).toBe('null');
        expect(inspectObject(undefined).type).toBe('undefined');
    });
    it('inspects a function', () => {
        function greet(name) { return `Hello ${name}`; }
        const result = inspectObject(greet, { methods: true });
        expect(result.type).toContain('function');
        expect(result.title).toContain('greet');
    });
    it('inspects a class instance', () => {
        class Dog {
            name;
            constructor(name) { this.name = name; }
            bark() { return 'Woof!'; }
            get loud() { return this.name.toUpperCase(); }
        }
        const d = new Dog('Rex');
        const result = inspectObject(d, { methods: true });
        expect(result.type).toBe('Dog');
        expect(result.members.find(m => m.name === 'name')).toBeDefined();
        expect(result.members.find(m => m.name === 'bark')).toBeDefined();
        expect(result.members.find(m => m.name === 'loud')).toBeDefined();
    });
    it('hides private members by default', () => {
        const obj = { public: 1, _private: 2, __dunder__: 3 };
        const result = inspectObject(obj);
        expect(result.members.find(m => m.name === '_private')).toBeUndefined();
        expect(result.hiddenCount).toBeGreaterThan(0);
    });
    it('shows private members with option', () => {
        const obj = { public: 1, _private: 2 };
        const result = inspectObject(obj, { private: true });
        expect(result.members.find(m => m.name === '_private')).toBeDefined();
    });
    it('hides methods by default', () => {
        class Foo {
            bar() { }
        }
        const result = inspectObject(new Foo());
        expect(result.members.find(m => m.name === 'bar')).toBeUndefined();
    });
    it('shows everything with all=true', () => {
        class Foo {
            x = 1;
            _y = 2;
            bar() { }
        }
        const result = inspectObject(new Foo(), { all: true });
        expect(result.members.find(m => m.name === 'x')).toBeDefined();
        expect(result.members.find(m => m.name === '_y')).toBeDefined();
        expect(result.members.find(m => m.name === 'bar')).toBeDefined();
    });
    it('sorts members: properties first, then methods', () => {
        class Foo {
            z = 1;
            a = 2;
            method() { }
        }
        const result = inspectObject(new Foo(), { methods: true, sort: true });
        const names = result.members.map(m => m.name);
        expect(names.indexOf('a')).toBeLessThan(names.indexOf('z'));
        expect(names.indexOf('z')).toBeLessThan(names.indexOf('method'));
    });
    it('handles arrays', () => {
        const result = inspectObject([1, 2, 3]);
        expect(result.type).toBe('Array');
        expect(result.members.find(m => m.name === '0')).toBeDefined();
    });
    it('handles Map and Set', () => {
        expect(inspectObject(new Map([['a', 1]])).type).toBe('Map');
        expect(inspectObject(new Set([1, 2])).type).toBe('Set');
    });
});
describe('inspect (formatted)', () => {
    it('returns a string with box drawing chars', () => {
        const output = inspect({ x: 1 });
        expect(output).toContain('╭');
        expect(output).toContain('╰');
        expect(output).toContain('x');
    });
    it('returns JSON with json option', () => {
        const output = inspect({ x: 1 }, { json: true });
        const parsed = JSON.parse(output);
        expect(parsed.type).toBe('Object');
        expect(parsed.members).toBeInstanceOf(Array);
    });
});
