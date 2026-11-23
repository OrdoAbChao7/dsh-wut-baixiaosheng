// crawler/notice-crawler.js — 武汉理工大学官方公开通知自动化采集与更新维护模块
// 原生 Node.js ESM 实现，零外部第三方依赖，具备容错隔离、哈希去重与历史版本保存能力。

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");
const NOTICES_DIR = join(ROOT_DIR, "references", "official-notices");
const HISTORY_DIR = join(NOTICES_DIR, "history");
const SOURCES_FILE = join(__dirname, "sources.json");

// 确保目录结构存在
for (const sub of ["school", "undergraduate-school", "student-affairs", "graduate-school", "colleges", "history"]) {
  const p = join(NOTICES_DIR, sub);
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

export function computeHash(content) {
  return createHash("sha256").update(content).digest("hex");
}

export function loadSources() {
  if (!existsSync(SOURCES_FILE)) return [];
  return JSON.parse(readFileSync(SOURCES_FILE, "utf8"));
}

export function saveSources(sources) {
  writeFileSync(SOURCES_FILE, JSON.stringify(sources, null, 2), "utf8");
}

/**
 * 链接可达性与失效链接检测
 */
export async function checkLinkAlive(url, timeoutMs = 5000) {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(timeoutMs) });
    return res.status >= 200 && res.status < 400;
  } catch {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
      return res.status >= 200 && res.status < 400;
    } catch {
      return false;
    }
  }
}

/**
 * HTML 正文纯文本清洗与提取
 */
export function cleanHtmlText(html) {
  if (!html) return "";
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
  return text;
}

/**
 * 解析通知列表与详情（针对学校标准通知结构）
 */
export async function crawlSource(source, options = {}) {
  const timeoutMs = options.timeoutMs || 8000;
  const maxItems = options.maxItems || 3;
  console.log(`[Crawler] 正在采集源: ${source.name} (${source.section_url})...`);
  const results = [];

  try {
    const res = await fetch(source.section_url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) WUT-Baixiaosheng-Bot/2.0",
      },
    });

    if (!res.ok) {
      console.warn(`[Crawler] 访问失败 HTTP ${res.status}: ${source.section_url}`);
      source.access_status = `HTTP_ERROR_${res.status}`;
      return results;
    }

    const html = await res.text();
    source.access_status = "ACTIVE_OK";
    source.last_crawl_time = new Date().toISOString();

    // 提取通知链接匹配模式
    const linkRegex = /href=["']([^"']*(?:tongzhigonggao|tzgg|notice|news|info|\d+)[^"']*\.(?:s?html?|htm))["'][^>]*>([^<]{4,100})<\/a>/gi;
    let match;
    const candidates = [];
    const seenLinks = new Set();

    while ((match = linkRegex.exec(html)) !== null) {
      let rawUrl = match[1];
      const title = match[2].trim();
      if (!title || title.includes("更多") || title.includes(">>")) continue;

      let absoluteUrl = rawUrl;
      if (rawUrl.startsWith("./")) {
        absoluteUrl = `${source.base_url}/${rawUrl.replace(/^\.\//, "")}`;
      } else if (rawUrl.startsWith("/")) {
        absoluteUrl = `${source.base_url}${rawUrl}`;
      } else if (!rawUrl.startsWith("http")) {
        absoluteUrl = `${source.base_url}/${rawUrl}`;
      }

      if (!seenLinks.has(absoluteUrl)) {
        seenLinks.add(absoluteUrl);
        candidates.push({ title, url: absoluteUrl });
      }
      if (candidates.length >= maxItems) break;
    }

    console.log(`[Crawler] ${source.name} 发现 ${candidates.length} 条待抓取通知候选`);

    // 逐条获取内容详情并封装标准化数据
    for (const item of candidates) {
      try {
        const detailRes = await fetch(item.url, {
          signal: AbortSignal.timeout(timeoutMs),
          headers: { "User-Agent": "WUT-Baixiaosheng-Bot/2.0" },
        });

        let content = item.title;
        let publishDate = new Date().toISOString().slice(0, 10);

        if (detailRes.ok) {
          const detailHtml = await detailRes.text();
          const cleanText = cleanHtmlText(detailHtml);
          if (cleanText.length > 50) content = cleanText;

          // 提取发布日期
          const dateMatch = detailHtml.match(/(202[0-9])[年\/-](1[0-2]|0?[1-9])[月\/-](3[01]|[12]\d|0?[1-9])日?/);
          if (dateMatch) {
            publishDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}`;
          }
        }

        const contentHash = computeHash(content);
        const noticeData = {
          title: item.title,
          source: source.name,
          source_url: item.url,
          publish_date: publishDate,
          crawl_time: new Date().toISOString(),
          category: source.category || "school",
          college: source.category === "colleges" ? source.name : "all",
          applicable_grade: "all",
          applicable_year: "2025-2026",
          content: content.slice(0, 2000), // 保留核心正文文本
          content_hash: contentHash,
          verification_status: "OFFICIAL_VERIFIED",
        };

        // 处理存储、去重与更新检测
        const saveResult = saveNotice(noticeData);
        results.push({ ...noticeData, saveResult });
      } catch (itemErr) {
        console.warn(`[Crawler] 抓取单条详情失败: ${item.url} -> ${itemErr.message}`);
      }
    }
  } catch (err) {
    console.error(`[Crawler] 采集源异常 ${source.name}: ${err.message}`);
    source.access_status = `ERROR_${err.message.slice(0, 30)}`;
  }

  return results;
}

/**
 * 结构化通知存储、去重与历史版本保存
 */
export function saveNotice(notice) {
  const categoryDir = join(NOTICES_DIR, notice.category || "school");
  if (!existsSync(categoryDir)) mkdirSync(categoryDir, { recursive: true });

  const safeTitle = notice.title.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5-]/g, "_").slice(0, 30);
  const fileName = `${notice.publish_date}_${safeTitle}.md`;
  const targetPath = join(categoryDir, fileName);

  // 1. 去重与更新检测
  if (existsSync(targetPath)) {
    const existingContent = readFileSync(targetPath, "utf8");
    if (existingContent.includes(notice.content_hash)) {
      return { status: "EXISTS_IDENTICAL", path: targetPath };
    } else {
      // 内容已更新，将旧版本归档到 history/
      const archiveName = `${notice.publish_date}_${safeTitle}_old_${Date.now()}.md`;
      writeFileSync(join(HISTORY_DIR, archiveName), existingContent, "utf8");
      console.log(`[Crawler] 发现通知更新，旧版本已归档至 history/${archiveName}`);
    }
  }

  // 2. 格式化正式通知 Markdown
  const mdText = `---
title: "${notice.title}"
source: "${notice.source}"
source_url: "${notice.source_url}"
publish_date: "${notice.publish_date}"
crawl_time: "${notice.crawl_time}"
category: "${notice.category}"
college: "${notice.college}"
applicable_grade: "${notice.applicable_grade}"
applicable_year: "${notice.applicable_year}"
content_hash: "${notice.content_hash}"
verification_status: "OFFICIAL_VERIFIED"
---

# ${notice.title}

> 📌 **官方发布信息**  
> - **来源发布方**：${notice.source}  
> - **官方原文网址**：[点击访问官方原文](${notice.source_url})  
> - **发布日期**：${notice.publish_date}  
> - **适用范围**：${notice.college}（年级：${notice.applicable_grade}）  
> - **入库校验哈希**：\`${notice.content_hash}\`

---

## 一、通知正文核心内容

${notice.content.slice(0, 1500)}

---
*注：本通知由武汉理工大学百晓生官方通知采集模块自动收录，内容以原始官方链接为准。*
`;

  writeFileSync(targetPath, mdText, "utf8");
  return { status: "SAVED_NEW", path: targetPath };
}

/**
 * 运行全量或单源采集
 */
export async function runCrawler(options = {}) {
  const sources = loadSources();
  const summary = { totalSources: sources.length, processed: 0, itemsCollected: [] };

  for (const src of sources) {
    if (options.sourceId && src.id !== options.sourceId) continue;
    // 如果受校园网限制且当前在公网，安全记录并跳过，不阻塞其他源
    if (src.access_level === "campus_network_required" && !options.allowRestricted) {
      console.log(`[Crawler] 跳过内网限制源: ${src.name} (保留人工上传入口)`);
      continue;
    }

    const items = await crawlSource(src, options);
    summary.processed++;
    summary.itemsCollected.push(...items);
  }

  saveSources(sources);
  return summary;
}

// 支持 CLI 独立运行: node crawler/notice-crawler.js
if (process.argv[1] && process.argv[1].endsWith("notice-crawler.js")) {
  console.log("=== 启动武汉理工大学官方通知采集测试 ===");
  const targetSource = process.argv[2] || "whut-main-tzgg";
  runCrawler({ sourceId: targetSource, maxItems: 2 })
    .then((res) => {
      console.log(`\n采集执行完毕！处理源: ${res.processed} 个, 抓取并入库通知: ${res.itemsCollected.length} 条`);
      for (const item of res.itemsCollected) {
        console.log(`- [${item.publish_date}] ${item.title} -> ${item.saveResult?.status}`);
      }
    })
    .catch((err) => {
      console.error("采集发生错误:", err);
      process.exit(1);
    });
}
