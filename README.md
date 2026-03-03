[English](README.md) | [中文](README.zh-CN.md)

# @indiekitai/rich-inspect

> Rich inspect() for JavaScript/TypeScript — beautifully formatted object inspection in the terminal.

Inspired by Python's [Rich](https://github.com/Textualize/rich) library's `inspect()` function. Displays properties, methods, types, and documentation for any JavaScript object with colored terminal output.

## Install

```bash
npm install @indiekitai/rich-inspect
```

## Usage

### As a library

```typescript
import { inspect } from '@indiekitai/rich-inspect';

class Dog {
  name: string;
  breed: string;
  constructor(name: string, breed: string) {
    this.name = name;
    this.breed = breed;
  }
  bark() { return 'Woof!'; }
  fetch(item: string) { return `Fetching ${item}`; }
}

const rex = new Dog('Rex', 'German Shepherd');

// Basic inspection
console.log(inspect(rex));

// Show methods too
console.log(inspect(rex, { methods: true }));

// Show everything
console.log(inspect(rex, { all: true }));

// Get JSON output
console.log(inspect(rex, { json: true }));
```

### CLI

```bash
# Inspect a JSON file
npx @indiekitai/rich-inspect data.json

# Inspect a JS module
npx @indiekitai/rich-inspect ./module.js

# Inspect a specific export
npx @indiekitai/rich-inspect ./module.js myFunction

# JSON output
npx @indiekitai/rich-inspect data.json --json

# Show all members
npx @indiekitai/rich-inspect ./module.js --all
```

### MCP Server

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "rich-inspect": {
      "command": "node",
      "args": ["path/to/rich-inspect/dist/mcp.js"]
    }
  }
}
```

**Tools:**
- `inspect_file` — Inspect a JSON file or JS module export
- `inspect_json` — Inspect a JSON string directly

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `title` | auto | Custom title for the panel |
| `methods` | `false` | Show callable members |
| `docs` | `true` | Show doc strings |
| `help` | `false` | Show full doc strings (not just first paragraph) |
| `private` | `false` | Show private members (starting with `_`) |
| `symbols` | `false` | Show Symbol properties |
| `sort` | `true` | Sort alphabetically, properties before methods |
| `all` | `false` | Show everything (methods + private + symbols) |
| `value` | `true` | Pretty print the object value |
| `json` | `false` | Return JSON instead of formatted string |

## API

### `inspect(obj, options?): string`

Inspect an object and return a formatted string (or JSON string if `json: true`).

### `inspectObject(obj, options?): InspectResult`

Inspect an object and return a structured result object.

### `formatInspect(result): string`

Format an `InspectResult` as a colored terminal string.

## License

MIT
