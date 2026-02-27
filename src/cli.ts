#!/usr/bin/env node
/**
 * CLI for rich-inspect
 * Usage:
 *   rich-inspect <file.json>         — inspect a JSON file
 *   rich-inspect <module.js> [export] — inspect a JS module export
 *   rich-inspect --help
 */

import { readFileSync } from 'fs';
import { resolve, extname } from 'path';
import { pathToFileURL } from 'url';
import { inspect } from './inspect.js';

interface CliArgs {
  file?: string;
  exportName?: string;
  json: boolean;
  all: boolean;
  methods: boolean;
  private: boolean;
  help: boolean;
  docs: boolean;
  fullHelp: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { json: false, all: false, methods: false, private: false, help: false, docs: true, fullHelp: false };
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--json': args.json = true; break;
      case '--all': case '-a': args.all = true; break;
      case '--methods': case '-m': args.methods = true; break;
      case '--private': case '-p': args.private = true; break;
      case '--no-docs': args.docs = false; break;
      case '--full-help': args.fullHelp = true; break;
      case '--help': case '-h': args.help = true; break;
      default: positional.push(a);
    }
  }

  args.file = positional[0];
  args.exportName = positional[1];
  return args;
}

const HELP = `
${'\x1b[1m'}rich-inspect${'\x1b[0m'} — Beautifully inspect any JS/TS object in the terminal

${'\x1b[33m'}Usage:${'\x1b[0m'}
  rich-inspect <file.json>                  Inspect a JSON file
  rich-inspect <module.js> [exportName]     Inspect a JS module export
  rich-inspect <module.js> default          Inspect default export

${'\x1b[33m'}Options:${'\x1b[0m'}
  --json          Output as JSON
  --all, -a       Show all members (methods + private)
  --methods, -m   Show methods
  --private, -p   Show private members
  --no-docs       Hide doc strings
  --full-help     Show full doc strings (not just first paragraph)
  -h, --help      Show this help
`;

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.file) {
    console.log(HELP);
    process.exit(args.help ? 0 : 1);
  }

  const filePath = resolve(args.file);
  const ext = extname(filePath).toLowerCase();
  let obj: unknown;

  if (ext === '.json') {
    try {
      const content = readFileSync(filePath, 'utf-8');
      obj = JSON.parse(content);
    } catch (e) {
      console.error(`Error reading JSON: ${e}`);
      process.exit(1);
    }
  } else if (['.js', '.mjs', '.cjs', '.ts', '.mts'].includes(ext)) {
    try {
      const mod = await import(pathToFileURL(filePath).href);
      if (args.exportName) {
        obj = mod[args.exportName];
        if (obj === undefined) {
          console.error(`Export "${args.exportName}" not found. Available: ${Object.keys(mod).join(', ')}`);
          process.exit(1);
        }
      } else {
        obj = mod;
      }
    } catch (e) {
      console.error(`Error importing module: ${e}`);
      process.exit(1);
    }
  } else {
    // Try as JSON first, then as module
    try {
      const content = readFileSync(filePath, 'utf-8');
      obj = JSON.parse(content);
    } catch {
      try {
        obj = await import(pathToFileURL(filePath).href);
      } catch (e) {
        console.error(`Cannot load file: ${e}`);
        process.exit(1);
      }
    }
  }

  const output = inspect(obj, {
    json: args.json,
    all: args.all,
    methods: args.methods,
    private: args.private,
    docs: args.docs,
    help: args.fullHelp,
  });

  console.log(output);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
