#!/usr/bin/env node
/**
 * MCP Server for rich-inspect
 * Exposes inspect() as an MCP tool.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readFileSync } from 'fs';
import { resolve, extname } from 'path';
import { pathToFileURL } from 'url';
import { inspectObject, type InspectOptions } from './inspect.js';

const server = new McpServer({
  name: 'rich-inspect',
  version: '0.1.0',
});

server.tool(
  'inspect_file',
  'Inspect a JSON file or JS module export, returning structured member info',
  {
    filePath: z.string().describe('Path to JSON or JS file'),
    exportName: z.string().optional().describe('Export name for JS modules'),
    all: z.boolean().optional().describe('Show all members'),
    methods: z.boolean().optional().describe('Show methods'),
    private: z.boolean().optional().describe('Show private members'),
  },
  async ({ filePath, exportName, all, methods, private: priv }) => {
    try {
      const fullPath = resolve(filePath);
      const ext = extname(fullPath).toLowerCase();
      let obj: unknown;

      if (ext === '.json') {
        obj = JSON.parse(readFileSync(fullPath, 'utf-8'));
      } else {
        const mod = await import(pathToFileURL(fullPath).href);
        obj = exportName ? mod[exportName] : mod;
      }

      const result = inspectObject(obj, {
        all: all ?? false,
        methods: methods ?? true,
        private: priv ?? false,
        docs: true,
      });

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (e) {
      return {
        content: [{ type: 'text' as const, text: `Error: ${e}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'inspect_json',
  'Inspect a JSON value directly, returning structured member info',
  {
    json: z.string().describe('JSON string to inspect'),
    all: z.boolean().optional().describe('Show all members'),
  },
  async ({ json, all }) => {
    try {
      const obj = JSON.parse(json);
      const result = inspectObject(obj, { all: all ?? false, methods: true, docs: true });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (e) {
      return {
        content: [{ type: 'text' as const, text: `Error: ${e}` }],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
