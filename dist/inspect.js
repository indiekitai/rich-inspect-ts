/**
 * Rich Inspect for TypeScript
 * Port of Python Rich's inspect() — beautifully formatted object inspection.
 */
// ── ANSI helpers ──
const ESC = '\x1b[';
const RESET = `${ESC}0m`;
const style = {
    bold: (s) => `${ESC}1m${s}${RESET}`,
    dim: (s) => `${ESC}2m${s}${RESET}`,
    italic: (s) => `${ESC}3m${s}${RESET}`,
    cyan: (s) => `${ESC}36m${s}${RESET}`,
    green: (s) => `${ESC}32m${s}${RESET}`,
    yellow: (s) => `${ESC}33m${s}${RESET}`,
    magenta: (s) => `${ESC}35m${s}${RESET}`,
    red: (s) => `${ESC}31m${s}${RESET}`,
    blue: (s) => `${ESC}34m${s}${RESET}`,
    gray: (s) => `${ESC}90m${s}${RESET}`,
    bgGray: (s) => `${ESC}48;5;236m${s}${RESET}`,
};
// ── Core logic ──
function getTypeName(obj) {
    if (obj === null)
        return 'null';
    if (obj === undefined)
        return 'undefined';
    if (typeof obj === 'function') {
        const kind = obj.toString().startsWith('class') ? 'class' : 'function';
        return `${kind} ${obj.name || '<anonymous>'}`;
    }
    const proto = Object.getPrototypeOf(obj);
    const ctorName = proto?.constructor?.name;
    return ctorName || typeof obj;
}
function getPrototypeChain(obj) {
    if (obj === null || obj === undefined)
        return '';
    const chain = [];
    let proto = Object.getPrototypeOf(obj);
    while (proto && proto !== Object.prototype) {
        chain.push(proto.constructor?.name || '?');
        proto = Object.getPrototypeOf(proto);
    }
    chain.push('Object');
    return chain.join(' → ');
}
function firstParagraph(doc) {
    const idx = doc.indexOf('\n\n');
    return idx === -1 ? doc : doc.slice(0, idx);
}
function safeStringify(val, depth = 2) {
    try {
        if (val === undefined)
            return 'undefined';
        if (val === null)
            return 'null';
        if (typeof val === 'function') {
            const src = val.toString();
            if (src.length > 120)
                return src.slice(0, 117) + '...';
            return src;
        }
        if (typeof val === 'symbol')
            return val.toString();
        if (typeof val === 'bigint')
            return `${val}n`;
        if (val instanceof RegExp)
            return val.toString();
        if (val instanceof Date)
            return val.toISOString();
        if (val instanceof Error)
            return `${val.name}: ${val.message}`;
        if (ArrayBuffer.isView(val))
            return `${val.constructor.name}(${val.length})`;
        if (val instanceof Map)
            return `Map(${val.size})`;
        if (val instanceof Set)
            return `Set(${val.size})`;
        if (val instanceof WeakMap)
            return 'WeakMap';
        if (val instanceof WeakSet)
            return 'WeakSet';
        if (val instanceof Promise)
            return 'Promise';
        const s = JSON.stringify(val, null, depth > 0 ? 2 : undefined);
        if (s !== undefined) {
            if (s.length > 500)
                return s.slice(0, 497) + '...';
            return s;
        }
        return String(val);
    }
    catch {
        return String(val);
    }
}
function getFunctionSignature(fn) {
    const src = fn.toString();
    // Class
    if (src.startsWith('class')) {
        const ctorMatch = src.match(/constructor\s*\(([^)]*)\)/);
        return ctorMatch ? `(${ctorMatch[1].trim()})` : '()';
    }
    // Arrow or regular function
    const match = src.match(/^(?:async\s+)?(?:function\s*\w*)?\s*\(([^)]*)\)/);
    if (match)
        return `(${match[1].trim()})`;
    // Arrow with single param
    const arrowMatch = src.match(/^(?:async\s+)?(\w+)\s*=>/);
    if (arrowMatch)
        return `(${arrowMatch[1]})`;
    return '(...)';
}
function getDoc(obj) {
    // JS doesn't have docstrings. Check for common patterns.
    if (typeof obj === 'function') {
        const src = obj.toString();
        // JSDoc-style comment at start of function body
        const match = src.match(/\{[\s]*\/\*\*([^]*?)\*\//);
        if (match) {
            return match[1]
                .split('\n')
                .map(l => l.replace(/^\s*\*\s?/, '').trim())
                .filter(Boolean)
                .join('\n');
        }
    }
    // Check for .description or .doc property
    if (obj && typeof obj === 'object') {
        const desc = obj.description ?? obj.doc ?? obj.__doc__;
        if (typeof desc === 'string')
            return desc;
    }
    return undefined;
}
/**
 * Collect member info from an object.
 */
function collectMembers(obj, opts) {
    if (obj === null || obj === undefined)
        return { members: [], hiddenCount: 0 };
    const allKeys = [];
    const seen = new Set();
    // Own enumerable + non-enumerable string keys
    try {
        for (const key of Object.getOwnPropertyNames(obj)) {
            if (!seen.has(key)) {
                seen.add(key);
                allKeys.push(key);
            }
        }
    }
    catch { /* empty */ }
    // Prototype keys
    try {
        let proto = Object.getPrototypeOf(obj);
        while (proto && proto !== Object.prototype && proto !== Function.prototype) {
            for (const key of Object.getOwnPropertyNames(proto)) {
                if (!seen.has(key)) {
                    seen.add(key);
                    allKeys.push(key);
                }
            }
            proto = Object.getPrototypeOf(proto);
        }
    }
    catch { /* empty */ }
    // Symbol keys
    if (opts.symbols) {
        try {
            for (const sym of Object.getOwnPropertySymbols(obj)) {
                if (!seen.has(sym)) {
                    seen.add(sym);
                    allKeys.push(sym);
                }
            }
        }
        catch { /* empty */ }
    }
    const totalCount = allKeys.length;
    // Filter
    const filteredKeys = allKeys.filter(key => {
        if (typeof key === 'symbol')
            return opts.symbols;
        if (key === 'constructor')
            return false;
        if (key.startsWith('__') && key.endsWith('__'))
            return opts.private; // dunder-like
        if (key.startsWith('_'))
            return opts.private;
        return true;
    });
    const hiddenCount = totalCount - filteredKeys.length;
    const members = [];
    for (const key of filteredKeys) {
        const keyName = typeof key === 'symbol' ? key.toString() : key;
        let descriptor;
        try {
            descriptor = Object.getOwnPropertyDescriptor(obj, key) ??
                Object.getOwnPropertyDescriptor(Object.getPrototypeOf(obj), key);
        }
        catch { /* empty */ }
        // Getter/setter
        if (descriptor && (descriptor.get || descriptor.set)) {
            let val;
            let error;
            try {
                val = obj[key];
            }
            catch (e) {
                error = String(e);
            }
            members.push({
                name: keyName,
                kind: descriptor.get && descriptor.set ? 'accessor' : descriptor.get ? 'getter' : 'setter',
                value: error ? undefined : val,
                type: error ? 'error' : typeof val,
                error,
            });
            continue;
        }
        let val;
        let error;
        try {
            val = obj[key];
        }
        catch (e) {
            error = String(e);
        }
        if (error) {
            members.push({ name: keyName, kind: 'property', type: 'error', error });
            continue;
        }
        if (typeof val === 'function') {
            if (!opts.methods)
                continue;
            const isClass = val.toString().startsWith('class');
            const isAsync = val.constructor?.name === 'AsyncFunction';
            let sig = getFunctionSignature(val);
            let prefix = isClass ? 'class' : isAsync ? 'async ' : '';
            let doc;
            if (opts.docs) {
                doc = getDoc(val);
                if (doc && !opts.help)
                    doc = firstParagraph(doc);
            }
            members.push({
                name: keyName,
                kind: 'method',
                type: isClass ? 'class' : isAsync ? 'async function' : 'function',
                signature: `${prefix}${keyName}${sig}`,
                doc,
            });
        }
        else {
            members.push({
                name: keyName,
                kind: 'property',
                value: val,
                type: val === null ? 'null' : typeof val,
            });
        }
    }
    if (opts.sort) {
        members.sort((a, b) => {
            // Callables after properties
            const aCall = a.kind === 'method' ? 1 : 0;
            const bCall = b.kind === 'method' ? 1 : 0;
            if (aCall !== bCall)
                return aCall - bCall;
            return a.name.replace(/^_+/, '').toLowerCase()
                .localeCompare(b.name.replace(/^_+/, '').toLowerCase());
        });
    }
    return { members, hiddenCount };
}
/**
 * Inspect an object and return structured result.
 */
export function inspectObject(obj, options = {}) {
    const { title, help = false, methods = false, docs = true, private: showPrivate = false, symbols = false, sort = true, all = false, value = true, } = options;
    const effectiveMethods = all || methods;
    const effectivePrivate = all || showPrivate;
    const effectiveSymbols = all || symbols;
    const typeName = getTypeName(obj);
    const protoChain = getPrototypeChain(obj);
    let doc;
    if (docs || help) {
        doc = getDoc(obj);
        if (doc && !help)
            doc = firstParagraph(doc);
    }
    const { members, hiddenCount } = collectMembers(obj, {
        methods: effectiveMethods,
        private: effectivePrivate,
        symbols: effectiveSymbols,
        sort,
        docs: docs || help,
        help,
    });
    const showValue = value && typeof obj !== 'function' && !(obj && typeof obj === 'object' && Object.getPrototypeOf(obj) === null);
    return {
        title: title || typeName,
        type: typeName,
        prototype: protoChain,
        doc,
        value: showValue ? obj : undefined,
        members,
        hiddenCount,
    };
}
// ── Formatting ──
function boxLine(content, width, position, title) {
    const chars = { top: ['╭', '╮', '─'], mid: ['│', '│', ' '], bot: ['╰', '╯', '─'] };
    const [l, r, fill] = chars[position];
    if (position === 'mid') {
        const padded = ` ${content}`;
        const pad = Math.max(0, width - stripAnsi(padded).length - 2);
        return `${style.cyan(l)}${padded}${' '.repeat(pad)}${style.cyan(r)}`;
    }
    if (title && position === 'top') {
        const t = ` ${title} `;
        const remaining = width - t.length - 2;
        const leftLen = Math.floor(remaining / 2);
        const rightLen = remaining - leftLen;
        return style.cyan(`${l}${fill.repeat(leftLen)}${t}${fill.repeat(rightLen)}${r}`);
    }
    return style.cyan(`${l}${fill.repeat(width - 2)}${r}`);
}
function stripAnsi(s) {
    return s.replace(/\x1b\[[0-9;]*m/g, '');
}
function highlightValue(val) {
    const s = safeStringify(val);
    if (val === null || val === undefined)
        return style.italic(style.magenta(s));
    if (typeof val === 'string')
        return style.green(`"${val}"`);
    if (typeof val === 'number' || typeof val === 'bigint')
        return style.cyan(s);
    if (typeof val === 'boolean')
        return style.yellow(s);
    return s;
}
/**
 * Format an InspectResult as a colored terminal string.
 */
export function formatInspect(result) {
    const lines = [];
    const minWidth = 60;
    // Collect content lines first to measure width
    const contentLines = [];
    // Prototype chain
    if (result.prototype) {
        contentLines.push(style.dim(`  ${result.prototype}`));
    }
    // Doc
    if (result.doc) {
        contentLines.push('');
        for (const line of result.doc.split('\n')) {
            contentLines.push(`  ${style.italic(style.gray(line))}`);
        }
    }
    // Value
    if (result.value !== undefined) {
        contentLines.push('');
        contentLines.push(`  ${highlightValue(result.value)}`);
    }
    // Members
    if (result.members.length > 0) {
        contentLines.push('');
        const maxNameLen = Math.max(...result.members.map(m => m.name.length));
        for (const m of result.members) {
            const pad = ' '.repeat(maxNameLen - m.name.length);
            if (m.kind === 'method') {
                const sig = m.signature || m.name;
                let line = `  ${pad}${style.bold(style.yellow(sig))}`;
                if (m.doc) {
                    line += ` ${style.dim('—')} ${style.italic(style.gray(m.doc.split('\n')[0]))}`;
                }
                contentLines.push(line);
            }
            else if (m.error) {
                contentLines.push(`  ${pad}${style.red(m.name)} = ${style.red(m.error)}`);
            }
            else {
                const nameStyle = m.name.startsWith('_') ? style.dim : (s) => s;
                contentLines.push(`  ${pad}${nameStyle(m.name)} ${style.dim('=')} ${highlightValue(m.value)}`);
            }
        }
    }
    // Hidden count
    if (result.hiddenCount > 0) {
        contentLines.push('');
        contentLines.push(`  ${style.dim(`${result.hiddenCount} attribute(s) not shown. Use { all: true } for full inspection.`)}`);
    }
    // Calculate width
    const maxContentWidth = Math.max(minWidth, ...contentLines.map(l => stripAnsi(l).length + 4));
    const width = Math.min(maxContentWidth, (process.stdout.columns || 100));
    lines.push(boxLine('', width, 'top', result.title));
    for (const cl of contentLines) {
        lines.push(boxLine(cl, width, 'mid'));
    }
    lines.push(boxLine('', width, 'bot'));
    return lines.join('\n');
}
/**
 * Inspect any JavaScript/TypeScript object and print formatted output to the terminal.
 * Main entry point — equivalent to Python's rich.inspect().
 */
export function inspect(obj, options = {}) {
    const result = inspectObject(obj, options);
    if (options.json) {
        return JSON.stringify(result, null, 2);
    }
    return formatInspect(result);
}
export default inspect;
