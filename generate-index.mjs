import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postsDir = path.join(__dirname, 'posts');
const outputFile = path.join(postsDir, 'index.json');

function stripQuotes(value) {
  const text = value.trim();
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text.slice(1, -1);
  }
  return text;
}

function parseScalar(raw) {
  const value = raw.trim();
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((item) => stripQuotes(item))
      .filter(Boolean);
  }
  return stripQuotes(value);
}

// 解析 Markdown 源文件的 YAML front matter，正文作为 content 返回
function parseMarkdownSource(raw, file) {
  const normalized = String(raw).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (!normalized.startsWith('---\n')) {
    throw new Error(`${file} 缺少 front matter（应以 --- 开头）`);
  }

  const end = normalized.indexOf('\n---', 4);
  if (end === -1) {
    throw new Error(`${file} 的 front matter 未闭合`);
  }

  const meta = {};
  let lastKey = null;

  const frontMatter = normalized.slice(4, end);
  for (const line of frontMatter.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const item = line.match(/^\s*-\s+(.*)$/);
    if (item) {
      if (!lastKey) throw new Error(`${file} 的列表项缺少所属字段`);
      if (!Array.isArray(meta[lastKey])) meta[lastKey] = [];
      meta[lastKey].push(parseScalar(item[1]));
      continue;
    }

    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!pair) throw new Error(`${file} 无法解析 front matter 行: ${line}`);

    const [, key, rawValue] = pair;
    lastKey = key;
    meta[key] = rawValue.trim() ? parseScalar(rawValue) : [];
  }

  const content = normalized.slice(end + 4).replace(/^\n+/, '');
  return { meta, content };
}

// 读取 posts 目录下所有 Markdown 源文件
const files = fs
  .readdirSync(postsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
  .map((entry) => entry.name)
  .sort();

const posts = [];
for (const file of files) {
  const filePath = path.join(postsDir, file);
  try {
    const { meta } = parseMarkdownSource(fs.readFileSync(filePath, 'utf-8'), file);
    if (!meta.id) meta.id = path.basename(file, '.md');
    if (!meta.title) meta.title = meta.id;
    // 列表页只保留 meta：不写入 content
    posts.push(meta);
  } catch (err) {
    console.error(`解析文件 ${file} 失败:`, err.message);
  }
}

// 按日期倒序排序
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

fs.writeFileSync(outputFile, JSON.stringify(posts, null, 2) + '\n', 'utf-8');
console.log(`✅ 已从 ${files.length} 个 Markdown 文件生成 ${posts.length} 篇文章索引到 ${outputFile}`);
