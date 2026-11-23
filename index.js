// dsh-wut-baixiaosheng — 武汉理工大学百晓生知识库，作为 runtime skill 注册进 DSH 技能目录。
// 纯数据插件：无网络、无外部依赖，只把随包的 SKILL.md + references/ 提供给会话。
import { readFileSync, readdirSync, existsSync } from "node:fs";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const NAME = "wut-baixiaosheng";

/** 读取随包 SKILL.md，拆出 frontmatter 的 description 与正文。 */
export function loadSkill(dir = DIR) {
  const raw = readFileSync(join(dir, "SKILL.md"), "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) throw new Error("SKILL.md has no YAML frontmatter");
  const desc = m[1].match(/description: >-\r?\n([\s\S]*?)(?=\n[a-z_]+:|$)/);
  const description = desc
    ? desc[1].split(/\r?\n/).map((l) => l.trim()).filter(Boolean).join(" ")
    : "武汉理工大学百晓生知识库";
  return { name: NAME, description, body: m[2], dir };
}

export const name = "dsh-wut-baixiaosheng";
export const inject = ["skills"];

export function apply(ctx) {
  const s = loadSkill();
  ctx.skills.register({
    name: s.name,
    description: s.description,
    content: s.body,
    source: "dsh-wut-baixiaosheng",
    resourceBase: { kind: "directory", path: join(s.dir, "references") },
    invocation: { modelInvocable: true, userInvocable: true },
  });
}

// 自检：node index.js --selftest
if (process.argv.includes("--selftest")) {
  console.log("=== [dsh-wut-baixiaosheng] Self-Test Starting ===");
  const s = loadSkill();

  // 1. 基础元数据验证
  assert.match(s.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Skill name format valid");
  assert.equal(s.name, "wut-baixiaosheng", "Skill name must be wut-baixiaosheng");
  assert.ok(s.description.length > 0 && s.description.length <= 500, `Description <= 500 chars (current: ${s.description.length})`);
  assert.ok(s.body.includes("references/"), "SKILL body contains references/ mention");

  // 2. 检查 cordis.patch.yml 存在且配置一致
  const patchContent = readFileSync(join(DIR, "cordis.patch.yml"), "utf8");
  assert.ok(patchContent.includes("dsh-wut-baixiaosheng"), "cordis.patch.yml registers dsh-wut-baixiaosheng");

  // 3. 检查 package.json 规范与依赖
  const pkgContent = JSON.parse(readFileSync(join(DIR, "package.json"), "utf8"));
  assert.equal(pkgContent.type, "module", "package.json type must be module");
  assert.equal(pkgContent.main, "index.js", "package.json main must be index.js");
  assert.equal(pkgContent.scripts?.test, "node index.js --selftest", "package.json test script configured");
  assert.equal(pkgContent.dsh?.bundle?.patch, "./cordis.patch.yml", "package.json dsh bundle patch configured");
  assert.ok(!pkgContent.dependencies || Object.keys(pkgContent.dependencies).length === 0, "Zero runtime dependencies required");

  // 4. 检查 references 目录文件映射（双向一致性）
  const refsPath = join(DIR, "references");
  assert.ok(existsSync(refsPath), "references/ directory must exist");
  const diskRefs = readdirSync(refsPath);
  assert.ok(diskRefs.length > 0, "references count > 0");

  const mentioned = [...s.body.matchAll(/`([A-Za-z0-9_-]+\.(?:md|txt))`/g)].map((m) => m[1]);
  const uniqueMentioned = [...new Set(mentioned)];
  const missingOnDisk = uniqueMentioned.filter((f) => !diskRefs.includes(f));
  assert.deepEqual(missingOnDisk, [], "All files mentioned in SKILL.md must exist on disk: " + missingOnDisk);

  const unindexedFiles = diskRefs.filter((f) => !uniqueMentioned.includes(f));
  assert.deepEqual(unindexedFiles, [], "All files in references/ must be indexed in SKILL.md: " + unindexedFiles);

  // 5. Markdown 相对链接有效性检查
  for (const refFile of diskRefs) {
    if (!refFile.endsWith(".md")) continue;
    const content = readFileSync(join(refsPath, refFile), "utf8");
    const links = [...content.matchAll(/\[([^\]]+)\]\(([^)#]+)(?:#[^)]+)?\)/g)];
    for (const [, , target] of links) {
      if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("mailto:")) continue;
      const targetPath = join(refsPath, target);
      assert.ok(existsSync(targetPath), `Markdown link "${target}" in ${refFile} must resolve to existing file on disk`);
    }
  }

  // 6. 核心各大领域全覆盖断言测试用例
  const domainTests = [
    {
      domain: "credits (学籍与学分绩点计算)",
      file: "xuefen-jidian-jisuan.md",
      requiredKeywords: ["平均学分绩点", "5.0", "课程绩点", "补考", "重修", "免修", "1.0", "3.5"],
    },
    {
      domain: "discipline (违纪处分与解除时限)",
      file: "weiji-chufen-banfa.md",
      requiredKeywords: ["警告", "严重警告", "记过", "留校察看", "开除学籍", "6 个月", "8 个月", "10 个月", "12 个月", "解除"],
    },
    {
      domain: "exams (考试违规与作弊开除红线)",
      file: "kaoshi-weigui-chuli.md",
      requiredKeywords: ["考试违纪", "考试作弊", "零分", "代替他人", "开除学籍"],
    },
    {
      domain: "appeals (学生申诉维权流程与时限)",
      file: "xuesheng-shensu-banfa.md",
      requiredKeywords: ["申诉处理委员会", "校团委", "10 日", "15 日", "湖北省教育厅"],
    },
    {
      domain: "awards (综合素质测评与各类奖学金评定)",
      file: "jiangxuejin-pingding.md",
      requiredKeywords: ["国家奖学金", "8,000", "国家励志奖学金", "5,000", "卓越奖学金", "20,000", "学校一等奖学金", "3,000", "互斥", "兼得"],
    },
    {
      domain: "graduation (毕业与学士学位GPA硬门槛及补救)",
      file: "xueshi-xuewei-shouyu.md",
      requiredKeywords: ["学士学位", "毕业证书", "2.0", "延长学习期限一年", "结业"],
    },
    {
      domain: "safety & dorm (宿舍管理与500W用电禁令)",
      file: "xiaoyuan-shenghuo-anquan.md",
      requiredKeywords: ["500", "大功率", "电热毯", "外宿", "21:30"],
    },
    {
      domain: "medical & contacts (医保报销比例与紧急服务热线)",
      file: "xiaoyuanwang-tushuguan-yiliao.md",
      requiredKeywords: ["88%", "80%", "50%", "80 元", "87651110"],
    },
    {
      domain: "maritime (航海类专业半军事化作息与专项奖学金)",
      file: "hanghai-banjunshihua.md",
      requiredKeywords: ["半军事化", "制服", "早操", "500 元", "兼得"],
    },
  ];

  for (const tc of domainTests) {
    const filePath = join(refsPath, tc.file);
    assert.ok(existsSync(filePath), `Domain file for ${tc.domain} exists`);
    const content = readFileSync(filePath, "utf8");
    for (const kw of tc.requiredKeywords) {
      assert.ok(content.includes(kw), `Domain ${tc.domain} content in ${tc.file} contains keyword "${kw}"`);
    }
    console.log(`  ✓ Domain test passed: ${tc.domain}`);
  }

  console.log(`SELFTEST OK: ${diskRefs.length} references verified, catalog description ${s.description.length} chars, ${uniqueMentioned.length} mentions all resolve cleanly.`);
}
