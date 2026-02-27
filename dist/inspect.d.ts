/**
 * Rich Inspect for TypeScript
 * Port of Python Rich's inspect() — beautifully formatted object inspection.
 */
export interface InspectOptions {
    /** Title to display. Defaults to type name. */
    title?: string;
    /** Show full doc strings rather than first paragraph. */
    help?: boolean;
    /** Show methods/callables. */
    methods?: boolean;
    /** Show doc strings. */
    docs?: boolean;
    /** Show private members (starting with _). */
    private?: boolean;
    /** Show symbol properties. */
    symbols?: boolean;
    /** Sort attributes alphabetically. */
    sort?: boolean;
    /** Show all (methods + private + symbols). */
    all?: boolean;
    /** Pretty print the value itself. */
    value?: boolean;
    /** Return JSON instead of formatted string. */
    json?: boolean;
}
export interface MemberInfo {
    name: string;
    kind: 'property' | 'method' | 'getter' | 'setter' | 'accessor';
    value?: unknown;
    type: string;
    error?: string;
    doc?: string;
    signature?: string;
}
export interface InspectResult {
    title: string;
    type: string;
    prototype: string;
    doc?: string;
    value?: unknown;
    members: MemberInfo[];
    hiddenCount: number;
}
/**
 * Inspect an object and return structured result.
 */
export declare function inspectObject(obj: unknown, options?: InspectOptions): InspectResult;
/**
 * Format an InspectResult as a colored terminal string.
 */
export declare function formatInspect(result: InspectResult): string;
/**
 * Inspect any JavaScript/TypeScript object and print formatted output to the terminal.
 * Main entry point — equivalent to Python's rich.inspect().
 */
export declare function inspect(obj: unknown, options?: InspectOptions): string;
export default inspect;
