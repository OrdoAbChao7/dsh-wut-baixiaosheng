// community/contribution-processor.js — 武汉理工大学百晓生 V2 社区贡献文件自动化处理与安全审计模块
// 纯 Node.js 原生标准库实现，零外部运行依赖，严格执行待审核隔离与隐私脱敏。

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { basename, extname, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");
const PENDING_DIR = join(ROOT_DIR, "references", "community", "pending");
const RAW_DIR = join(PENDING_DIR, "raw");

// 确保隔离目录存在
if (!existsSync(RAW_DIR)) mkdirSync(RAW_DIR, { recursive: true });

// 武汉理工大学已知二级教学学院列表
export const WUT_COLLEGES = [
  "计算机与人工智能学院", "汽车工程学院", "交通与物流工程学院", "机械工程学院",
  "材料科学与工程学院", "信息工程学院", "自动化学院", "航海学院",
  "船海与能源动力工程学院", "土木工程与建筑学院", "化学化工与生命科学学院",
  "管理学院", "经济学院", "法学与人文社会学院", "马克思主义学院",
  "外国语学院", "艺术与设计学院", "理学院", "安全科学与应急管理学院",
  "国际教育学院", "材料示范学院", "创业学院"
];

/**
 * 隐私脱敏处理：自动清洗身份证号、手机号、学号及银行卡号
 */
export function sanitizePrivacy(text) {
  if (typeof text !== "string") return "";
  let clean = text;
  // 18 位二代身份证号脱敏
  clean = clean.replace(/\b\d{6}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/g, "[身份证号已脱敏]");
  // 11 位手机号脱敏
  clean = clean.replace(/\b1[3-9]\d{9}\b/g, "[手机号已脱敏]");
  // 武汉理工常见 13 位学号（如 0122119010101）脱敏
  clean = clean.replace(/\b012\d{10}\b/g, "[学号已脱敏]");
  // 银行卡号脱敏 (16-19位)
  clean = clean.replace(/\b62\d{14,17}\b/g, "[银行卡号已脱敏]");
  return clean;
}

/**
 * 计算 Buffer 或文本的 SHA-256 哈希值
 */
export function computeHash(data) {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * 检查内容哈希是否在现有库中已存在（重复检测）
 */
export function checkDuplicate(hash, targetDir = join(ROOT_DIR, "references")) {
  if (!existsSync(targetDir)) return null;
  const entries = readdirSync(targetDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(targetDir, entry.name);
    if (entry.isDirectory()) {
      const found = checkDuplicate(hash, fullPath);
      if (found) return found;
    } else if (entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".txt") || entry.name.endsWith(".json"))) {
      try {
        const content = readFileSync(fullPath, "utf8");
        if (content.includes(hash)) {
          return fullPath;
        }
      } catch {
        // 忽略二进制或读取异常
      }
    }
  }
  return null;
}

/**
 * 自动识别与抽取元数据 (学校、学院、专业、年份、类别)
 */
export function extractMetadata(text, filename = "") {
  const meta = {
    school: "武汉理工大学",
    college: "全校通用",
    major: "全部专业",
    grade: "全部年级",
    year: new Date().getFullYear().toString(),
    category: "综合资料",
    title: basename(filename, extname(filename)),
    publishDate: new Date().toISOString().slice(0, 10),
  };

  const combined = filename + "\n" + text;

  // 匹配学院
  for (const col of WUT_COLLEGES) {
    if (combined.includes(col) || combined.includes(col.replace("学院", ""))) {
      meta.college = col;
      break;
    }
  }

  // 匹配年份
  const yearMatch = combined.match(/202[0-9]年|202[0-9]/);
  if (yearMatch) {
    meta.year = yearMatch[0].replace("年", "");
  }

  // 匹配日期 (优先匹配两位数日，避免贪婪或短前缀截断)
  const dateMatch = combined.match(/(202[0-9])[年\/-](1[0-2]|0?[1-9])[月\/-](3[01]|[12]\d|0?[1-9])日?/);
  if (dateMatch) {
    const y = dateMatch[1];
    const m = dateMatch[2].padStart(2, "0");
    const d = dateMatch[3].padStart(2, "0");
    meta.publishDate = `${y}-${m}-${d}`;
  }

  // 匹配年级
  const gradeMatch = combined.match(/202[0-9]级|大[一二三四]|本科生|研究生/);
  if (gradeMatch) {
    meta.grade = gradeMatch[0];
  }

  // 匹配分类
  if (/转专业|大类分流|志愿填报/.test(combined)) meta.category = "转专业与分流";
  else if (/培养方案|课程大纲|教学计划|学分/.test(combined)) meta.category = "培养方案与课程";
  else if (/奖学金|评优|先进班集体|三好学生|表彰/.test(combined)) meta.category = "奖助学金与评优";
  else if (/考试|题库|期末|答案|复习/.test(combined)) meta.category = "考试与题库";
  else if (/保研|推免|夏令营|拟录取/.test(combined)) meta.category = "保研推免";
  else if (/宿舍|门禁|违章电器|水电|医保/.test(combined)) meta.category = "校园生活与后勤";
  else if (/处分|违纪|作弊|申诉/.test(combined)) meta.category = "纪律处分与申诉";

  return meta;
}

/**
 * 核心处理方法：接收用户上传文件，执行安全性检测、脱敏、哈希去重与生成待审核 PR 贡献文件
 */
export function processContribution({ filePath, originalFilename = basename(filePath), rawBuffer, rawText = "", uploaderComment = "" }) {
  const buffer = rawBuffer || (filePath ? readFileSync(filePath) : Buffer.from(rawText));
  const textContent = rawText || buffer.toString("utf8", 0, Math.min(buffer.length, 1024 * 1024)); // 针对文本或抽样
  const hash = computeHash(buffer);

  // 1. 去重检测
  const duplicatePath = checkDuplicate(hash);
  if (duplicatePath) {
    return {
      status: "DUPLICATE",
      message: `检测到该文件内容在知识库中已存在，无需重复提交：${basename(duplicatePath)}`,
      hash,
      existingFile: duplicatePath,
    };
  }

  // 2. 隐私信息检测与脱敏
  const sanitized = sanitizePrivacy(textContent);
  const privacyMasked = sanitized !== textContent;

  // 3. 元数据抽取
  const meta = extractMetadata(sanitized, originalFilename);

  // 4. 保存原始文件到待审核隔离区 (Pending Raw)
  const ext = extname(originalFilename) || ".txt";
  const safeBase = basename(originalFilename, ext).replace(/[^a-zA-Z0-9_\u4e00-\u9fa5-]/g, "_");
  const rawFileName = `${meta.publishDate}_${safeBase}_${hash.slice(0, 8)}${ext}`;
  const rawFilePath = join(RAW_DIR, rawFileName);
  writeFileSync(rawFilePath, buffer);

  // 5. 生成标准化待审核 Markdown 摘要
  const pendingMdFileName = `${meta.publishDate}_${safeBase}_${hash.slice(0, 8)}.md`;
  const pendingMdPath = join(PENDING_DIR, pendingMdFileName);

  const markdownContent = `---
title: "${meta.title}"
source: "社区贡献 (Community Submission)"
publish_date: "${meta.publishDate}"
school: "${meta.school}"
college: "${meta.college}"
major: "${meta.major}"
applicable_grade: "${meta.grade}"
applicable_year: "${meta.year}"
category: "${meta.category}"
content_hash: "${hash}"
raw_file: "references/community/pending/raw/${rawFileName}"
verification_status: "PENDING_REVIEW"
privacy_sanitized: ${privacyMasked}
updated_at: "${new Date().toISOString()}"
---

# ${meta.title}

> ⚠️ **待审核隔离提示**：本资料由同学自主贡献提供，处于待审核状态（PENDING_REVIEW），尚未合并入学校正式政策库。
> - **来源说明**：${uploaderComment || "用户通过对话上传提交"}
> - **适用范围**：${meta.school} / ${meta.college} / ${meta.grade}
> - **原始文件归档**：\`references/community/pending/raw/${rawFileName}\` (SHA-256: \`${hash}\`)

---

## 一、资料摘要与核心提要

${sanitized.slice(0, 800).trim()}${sanitized.length > 800 ? "\n\n...(全文已安全归档，请查阅完整原文)..." : ""}

---

## 二、维护者合规审核清单 (Review Checklist)
- [ ] 1. 确认资料来源真实，无虚构伪造。
- [ ] 2. 确认已彻底去除学生个人隐私（姓名、学号、手机号、成绩）。
- [ ] 3. 确认未将学生主观经验包装为官方行政政策。
- [ ] 4. 审核通过后，执行指令移动至 \`references/community/approved/\` 并更新 SKILL.md 索引。
`;

  writeFileSync(pendingMdPath, markdownContent, "utf8");

  // 6. 生成可用于提 PR 的变更指引
  const prGuide = {
    branch: `contrib/${safeBase.slice(0, 20)}-${hash.slice(0, 6)}`,
    title: `[Community] 提交新资料: ${meta.college} - ${meta.title}`,
    body: `### 社区资料贡献简报\n- **资料名称**：${meta.title}\n- **适用机构**：${meta.college}\n- **适用年级/年份**：${meta.grade} / ${meta.year}\n- **资料分类**：${meta.category}\n- **安全脱敏状态**：${privacyMasked ? "已完成自动隐私脱敏" : "无敏感信息"}\n- **待审核摘要文件**：\`references/community/pending/${pendingMdFileName}\`\n- **原始归档文件**：\`references/community/pending/raw/${rawFileName}\``,
  };

  return {
    status: "SUCCESS",
    hash,
    metadata: meta,
    rawFilePath,
    pendingMdPath,
    privacyMasked,
    prGuide,
  };
}

// 支持 CLI 独立调试运行
if (process.argv[1] && process.argv[1].endsWith("contribution-processor.js")) {
  const target = process.argv[2];
  if (!target) {
    console.log("Usage: node community/contribution-processor.js <file-path>");
    process.exit(0);
  }
  const result = processContribution({ filePath: target });
  console.log("Processing Result:", JSON.stringify(result, null, 2));
}
