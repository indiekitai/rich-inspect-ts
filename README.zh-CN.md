[English](README.md) | [中文](README.zh-CN.md)

# @indiekitai/rich-inspect

> JavaScript/TypeScript 的 Rich inspect() — 在终端中美观地格式化输出对象信息。

灵感来自 Python [Rich](https://github.com/Textualize/rich) 库的 `inspect()` 函数。以彩色终端输出展示任意 JavaScript 对象的属性、方法、类型和文档。

## 安装

```bash
npm install @indiekitai/rich-inspect
```

## 用法

### 作为库使用

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

// 基本检查
console.log(inspect(rex));

// 显示方法
console.log(inspect(rex, { methods: true }));

// 显示全部
console.log(inspect(rex, { all: true }));

// 获取 JSON 输出
console.log(inspect(rex, { json: true }));
```

### CLI

```bash
# 检查 JSON 文件
npx @indiekitai/rich-inspect data.json

# 检查 JS 模块
npx @indiekitai/rich-inspect ./module.js

# 检查特定导出
npx @indiekitai/rich-inspect ./module.js myFunction

# JSON 输出
npx @indiekitai/rich-inspect data.json --json

# 显示所有成员
npx @indiekitai/rich-inspect ./module.js --all
```

### MCP Server

添加到你的 MCP 配置：

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

**工具：**
- `inspect_file` — 检查 JSON 文件或 JS 模块导出
- `inspect_json` — 直接检查 JSON 字符串

## 选项

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `title` | 自动 | 面板自定义标题 |
| `methods` | `false` | 显示可调用成员 |
| `docs` | `true` | 显示文档字符串 |
| `help` | `false` | 显示完整文档（不仅是第一段） |
| `private` | `false` | 显示私有成员（以 `_` 开头） |
| `symbols` | `false` | 显示 Symbol 属性 |
| `sort` | `true` | 按字母排序，属性在方法前 |
| `all` | `false` | 显示全部（方法 + 私有 + Symbol） |
| `value` | `true` | 美观打印对象值 |
| `json` | `false` | 返回 JSON 而非格式化字符串 |

## API

### `inspect(obj, options?): string`

检查对象并返回格式化字符串（如果 `json: true` 则返回 JSON 字符串）。

### `inspectObject(obj, options?): InspectResult`

检查对象并返回结构化结果对象。

### `formatInspect(result): string`

将 `InspectResult` 格式化为带颜色的终端字符串。

## License

MIT
