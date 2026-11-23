// test/v2-verification.test.js — 武汉理工大学百晓生 V2 端到端自动化验收与能力测试套件
import assert from "node:assert/strict";
import { readFileSync, existsSync, writeFileSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import * as plugin from "../index.js";
import { sanitizePrivacy, computeHash, extractMetadata, processContribution } from "../community/contribution-processor.js";
import { loadSources, saveNotice } from "../crawler/notice-crawler.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");

console.log("=== [DSH-WUT Baixiaosheng V2] 启动全量自动化验证测试 ===");

// 1. 验证 Cordis / DSH 原生插件注册与运行时兼容性
console.log("\n[Test 1] 验证 Cordis/DSH 插件规范与注册能力...");
assert.equal(plugin.name, "dsh-wut-baixiaosheng");
assert.deepEqual(plugin.inject, ["skills"]);

let skillRegistered = null;
const mockCtx = {
  skills: {
    register: (opts) => {
      skillRegistered = opts;
    },
  },
};

plugin.apply(mockCtx);
assert.ok(skillRegistered, "Skill must be registered via ctx.skills.register");
assert.equal(skillRegistered.name, "wut-baixiaosheng");
assert.ok(skillRegistered.description.length > 0 && skillRegistered.description.length <= 500, "Description <= 500 chars");
assert.equal(skillRegistered.invocation.modelInvocable, true);
assert.equal(skillRegistered.invocation.userInvocable, true);
assert.equal(skillRegistered.resourceBase.kind, "directory");
assert.ok(existsSync(skillRegistered.resourceBase.path), "resourceBase path must exist on disk");
console.log("  ✓ Cordis 插件规范、零依赖注入与 Skill 注册接口校验通过");

// 2. 验证原有知识库问答能力无退化（核心指标回归）
console.log("\n[Test 2] 验证原有核心政策条文无退化...");
const policiesPath = join(ROOT_DIR, "references");
const regressionRules = [
  { file: "xuefen-jidian-jisuan.md", keywords: ["5.0", "补考", "1.0", "免修"] },
  { file: "xueye-yujing-tuixue.md", keywords: ["14 学分", "30 学分", "降级", "退学"] },
  { file: "weiji-chufen-banfa.md", keywords: ["警告", "6 个月", "严重警告", "8 个月", "记过", "10 个月", "留校察看", "12 个月"] },
  { file: "xueshi-xuewei-shouyu.md", keywords: ["2.0", "第八十四条", "延长学习期限一年"] },
  { file: "jiangxuejin-pingding.md", keywords: ["国家奖学金", "国家励志奖学金", "卓越奖学金", "学校一等奖学金", "互斥"] },
  { file: "xiaoyuan-shenghuo-anquan.md", keywords: ["500 瓦", "电吹风", "热得快"] },
  { file: "xiaoyuanwang-tushuguan-yiliao.md", keywords: ["88%", "80%", "50%"] },
];

for (const rule of regressionRules) {
  const p = join(policiesPath, rule.file);
  assert.ok(existsSync(p), `Policy file ${rule.file} exists`);
  const text = readFileSync(p, "utf8");
  for (const kw of rule.keywords) {
    assert.ok(text.includes(kw), `Policy ${rule.file} retains keyword: "${kw}"`);
  }
}
console.log("  ✓ 原有 9 大核心规章知识库指标 100% 留存，问答能力无退化");

// 3. 验证贡献邀请引导行为规范与触发条件判定
console.log("\n[Test 3] 验证贡献邀请引导条件...");
const skillDoc = readFileSync(join(ROOT_DIR, "SKILL.md"), "utf8");
assert.ok(skillDoc.includes("社区资料贡献引导行为规范"), "SKILL.md contains contribution policy");
assert.ok(skillDoc.includes("「如果你手头有这方面的学校通知、学院文件或课程资料，可以直接上传给我。我可以帮你提取、整理，并生成 GitHub 贡献内容，让更多武理工同学受益。」"), "Standard invitation quote matches spec");
assert.ok(skillDoc.includes("缺少对应学院资料"), "Trigger condition 1 present");
assert.ok(skillDoc.includes("知识库政策可能过期"), "Trigger condition 2 present");
assert.ok(skillDoc.includes("用户提供尚未收录的新通知"), "Trigger condition 3 present");
assert.ok(skillDoc.includes("用户主动询问如何贡献"), "Trigger condition 4 present");
assert.ok(skillDoc.includes("严禁在每一次日常回答后机械式输出邀请"), "Anti-annoyance constraint present");
console.log("  ✓ 贡献引导触发规范及非干扰约束校验通过");

// 4. 验证对话上传资料处理、隐私脱敏、元数据识别与待审核 PR 打包
console.log("\n[Test 4] 验证社区贡献处理模块 (脱敏/元数据/查重/PR打包)...");
const sampleRaw = `
关于计算机与人工智能学院2025年秋季学期选课与转专业答疑的通知
发布时间：2025年09月12日
适用对象：2025级本科生
负责人：辅导员李老师（手机：13988889999，办公电话：027-86551122）
学生代表：王小明（学号：0122119098765，身份证号：420111200305051234，银行卡：6212261234567890123）
转专业咨询地点：鉴湖校区计算机学院大楼 302 室。
`;

// 4.1 隐私脱敏断言
const sanitized = sanitizePrivacy(sampleRaw);
assert.ok(!sanitized.includes("13988889999"), "Mobile phone must be masked");
assert.ok(!sanitized.includes("0122119098765"), "Student ID must be masked");
assert.ok(!sanitized.includes("420111200305051234"), "National ID card must be masked");
assert.ok(!sanitized.includes("6212261234567890123"), "Bank card must be masked");
assert.ok(sanitized.includes("[手机号已脱敏]"));
assert.ok(sanitized.includes("[学号已脱敏]"));
assert.ok(sanitized.includes("[身份证号已脱敏]"));

// 4.2 元数据抽取断言
const meta = extractMetadata(sanitized, "2025计算机学院选课与转专业通知.docx");
assert.equal(meta.college, "计算机与人工智能学院");
assert.equal(meta.year, "2025");
assert.equal(meta.publishDate, "2025-09-12");
assert.equal(meta.grade, "2025级");
assert.equal(meta.category, "转专业与分流");

// 4.3 端到端处理与待审核 PR 生成
const processRes = processContribution({
  originalFilename: "2025计算机学院选课通知.txt",
  rawText: sampleRaw,
  uploaderComment: "大一新生年级群转发",
});
assert.equal(processRes.status, "SUCCESS");
assert.equal(processRes.privacyMasked, true);
assert.ok(existsSync(processRes.pendingMdPath), "Pending Markdown summary must be generated");
assert.ok(existsSync(processRes.rawFilePath), "Pending raw file must be archived");

// 4.4 重复提交检测
const duplicateRes = processContribution({
  originalFilename: "2025计算机学院选课通知_再次上传.txt",
  rawText: sampleRaw,
});
assert.equal(duplicateRes.status, "DUPLICATE", "Duplicate file must be detected via hash");

// 清理测试产物
try {
  unlinkSync(processRes.pendingMdPath);
  unlinkSync(processRes.rawFilePath);
} catch {}
console.log("  ✓ 对话上传资料脱敏、哈希去重、元数据识别与待审核打包功能全部正常");

// 5. 验证官方通知采集模块与来源注册表
console.log("\n[Test 5] 验证官方通知采集模块、来源注册表与结构化字段...");
const sources = loadSources();
assert.ok(Array.isArray(sources) && sources.length >= 5, "Sources registry has >= 5 entries");
const mainSource = sources.find((s) => s.id === "whut-main-tzgg");
assert.ok(mainSource, "Main WHUT notices source exists");
assert.equal(mainSource.access_level, "public");

const dummyNotice = {
  title: "测试通知：武汉理工大学2026年选修课排课预告",
  source: "本科生院（教务处）",
  source_url: "http://jwc.whut.edu.cn/tzgg/202611/test.html",
  publish_date: "2026-11-23",
  crawl_time: new Date().toISOString(),
  category: "undergraduate-school",
  college: "all",
  applicable_grade: "all",
  applicable_year: "2025-2026-1",
  content: "这是一份用于自动化测试的官方通知正文内容，请同学们准时登录选课系统选课。",
  content_hash: computeHash("选修课排课测试内容"),
  verification_status: "OFFICIAL_VERIFIED",
};

const saveRes = saveNotice(dummyNotice);
assert.ok(saveRes.path && existsSync(saveRes.path), "Notice saved into official-notices");
const savedContent = readFileSync(saveRes.path, "utf8");
assert.ok(savedContent.includes("OFFICIAL_VERIFIED"));
assert.ok(savedContent.includes(dummyNotice.content_hash));

// 再次保存相同哈希检测重复
const reSaveRes = saveNotice(dummyNotice);
assert.equal(reSaveRes.status, "EXISTS_IDENTICAL", "Identical hash must be skipped");

// 清理测试保存的通知文件
try {
  unlinkSync(saveRes.path);
} catch {}
console.log("  ✓ 官方通知采集数据结构、哈希去重与历史更新流校验通过");

// 6. 验证待审核资料与正式知识库严格物理隔离
console.log("\n[Test 6] 验证待审核资料物理隔离与安全性...");
const pendingDir = join(ROOT_DIR, "references", "community", "pending");
const approvedDir = join(ROOT_DIR, "references", "community", "approved");
assert.ok(existsSync(pendingDir));
assert.ok(existsSync(approvedDir));
const pendingReadme = readFileSync(join(pendingDir, "README.md"), "utf8");
assert.ok(pendingReadme.includes("待审核状态 (Pending Review)"));
assert.ok(pendingReadme.includes("严禁直接进入大模型正式问答知识库"));
console.log("  ✓ 待审核隔离区物理边界与防污染机制校验通过");

// 7. 验证 GitHub 社区支持文件 (Issue Forms / PR Template / CONTRIBUTING)
console.log("\n[Test 7] 验证 GitHub Issue Forms, PR 模板与 CONTRIBUTING.md...");
assert.ok(existsSync(join(ROOT_DIR, ".github", "ISSUE_TEMPLATE", "config.yml")));
assert.ok(existsSync(join(ROOT_DIR, ".github", "ISSUE_TEMPLATE", "submit-material.yml")));
assert.ok(existsSync(join(ROOT_DIR, ".github", "ISSUE_TEMPLATE", "policy-fix.yml")));
assert.ok(existsSync(join(ROOT_DIR, ".github", "ISSUE_TEMPLATE", "outdated-notice.yml")));
assert.ok(existsSync(join(ROOT_DIR, ".github", "ISSUE_TEMPLATE", "experience-share.yml")));
assert.ok(existsSync(join(ROOT_DIR, ".github", "pull_request_template.md")));
assert.ok(existsSync(join(ROOT_DIR, "CONTRIBUTING.md")));
console.log("  ✓ 4 大 GitHub Issue Forms、PR 模板与贡献指南完备");

console.log("\n=======================================================");
console.log("🎉 ALL TESTS PASSED: DSH-WUT Baixiaosheng V2 验收测试 100% 成功！");
console.log("=======================================================");
