import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postsDir = path.join(__dirname, '..', 'posts');
const outputFile = path.join(postsDir, 'index.json');

// 读取 posts 目录下的所有 .json 文件（排除 index.json）
const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.json') && file !== 'index.json');

const posts = [];
for (const file of files) {
  const filePath = path.join(postsDir, file);
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    const post = JSON.parse(raw);
    // 只保留必要字段（不包含 content，用于列表页；如果需要 content 也包含，可以注释掉下一行）
    const { content, ...meta } = post;
    posts.push(meta);
  } catch (err) {
    console.error(`解析文件 ${file} 失败:`, err);
  }
}

// 按日期倒序排序
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

fs.writeFileSync(outputFile, JSON.stringify(posts, null, 2), 'utf-8');
console.log(`✅ 已生成 ${posts.length} 篇文章索引到 ${outputFile}`);
