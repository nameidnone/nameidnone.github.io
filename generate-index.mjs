import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postsDir = path.join(__dirname, 'posts');
const outputFile = path.join(postsDir, 'index.json');

// 读取 posts 目录下所有 .json 文件（排除生成的 index.json）
const files = fs
  .readdirSync(postsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'index.json')
  .map((entry) => entry.name);

const posts = [];
for (const file of files) {
  const filePath = path.join(postsDir, file);
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    const post = JSON.parse(raw);
    // 列表页只保留 meta：必须剥离 content 字段
    const { content, ...meta } = post;
    if (!meta.id) meta.id = path.basename(file, '.json');
    posts.push(meta);
  } catch (err) {
    console.error(`解析文件 ${file} 失败:`, err);
  }
}

// 按日期倒序排序
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

fs.writeFileSync(outputFile, JSON.stringify(posts, null, 2) + '\n', 'utf-8');
console.log(`✅ 已生成 ${posts.length} 篇文章索引到 ${outputFile}`);
