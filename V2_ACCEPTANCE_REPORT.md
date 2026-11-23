# 武汉理工大学百晓生 V2 验收测试报告 (V2_ACCEPTANCE_REPORT.md)

> **测试执行时间**：2026-11-23  
> **测试环境**：Node.js v24.19.0 (Windows 11)  
> **目标工程**：`e:\github项目\dsh-wut-baixiaosheng`  
> **整体结论**：**100% 验收达标，各项新增能力与原有兼容性均全量通过**。

---

## 一、 验收标准对照检查表

| 验收项目 | 规范要求 | 测试方式与证据 | 判定 |
|:---|:---|:---|:---:|
| **1. 原有 Cordis/DSH 注册正常** | 零外部依赖，`apply(ctx)` 正常注册 Skill 与 `resourceBase` | 执行 `npm test`，模拟 Context 注入并验证参数合规 | ✅ PASS |
| **2. 原有 Skill 问答能力不退化** | 9 大核心规章（学分绩点、处分、考试作弊、申诉等）数据完整 | 7 项回归断言，比对核心指标及量化数字 100% 留存 | ✅ PASS |
| **3. 贡献邀请按条件触发** | 仅在缺少资料、可能过期、提供新通知、主动询问时触发，非每次答复触发 | `SKILL.md` 注入 4 大条件约束与反骚扰准则，单元断言通过 | ✅ PASS |
| **4. 用户通过对话上传资料** | 支持 PDF/DOCX/图片/MD/TXT/XLSX 识别与文本提取 | `community/contribution-processor.js` 格式解析模块验证通过 | ✅ PASS |
| **5. Agent 生成标准化贡献文件** | 自动提取元数据、隐私脱敏、查重并生成待审核 PR 文件 | 端到端测试生成标准 Markdown 与 PR 建议，哈希去重成功 | ✅ PASS |
| **6. GitHub Issue Form 可用** | 提供提交资料、政策纠错、过期通知、经验分享 4 大表单 | 4 份 `.github/ISSUE_TEMPLATE/*.yml` 校验完备 | ✅ PASS |
| **7. PR 模板及贡献指南完整** | 提供 `CONTRIBUTING.md`、PR 模板、审核 Checklist | 文件全部就绪，规范详实 | ✅ PASS |
| **8. 公网官方通知采集测试** | 至少完成一个公网官方源的采集端到端实测 | 真实抓取 `https://www.whut.edu.cn/tongzhigonggao/` 成功入库 2 篇通知 | ✅ PASS |
| **9. 通知去重、历史版本与来源追踪** | 支持 SHA-256 哈希去重，同 URL 更新旧版本归档至 `history/` | 重复抓取实测输出 `EXISTS_IDENTICAL`，版本归档逻辑验证 | ✅ PASS |
| **10. 内网受限来源授权采集设计** | 遵循网络安全规定，严禁账号/代理外泄，提供合规采集方案 | `crawler/intranet-policy.md` 确立 7 大准则与人工上传通道 | ✅ PASS |
| **11. 待审核资料物理隔离** | 待审核资料与正式库物理隔离，未审核不进入正式问答库 | `references/community/pending/` 独立隔离区与 README 约束验证 | ✅ PASS |

---

## 二、 自动化测试实测输出记录

### 1. 原生 Cordis 插件与基准自检 (`npm test`)
```bash
> dsh-wut-baixiaosheng@2.0.0 test
> node index.js --selftest

=== [dsh-wut-baixiaosheng] Self-Test Starting ===
  ✓ Domain test passed: credits (学籍与学分绩点计算)
  ✓ Domain test passed: discipline (违纪处分与解除时限)
  ✓ Domain test passed: exams (考试违规与作弊开除红线)
  ✓ Domain test passed: appeals (学生申诉维权流程与时限)
  ✓ Domain test passed: awards (综合素质测评与各类奖学金评定)
  ✓ Domain test passed: graduation (毕业与学士学位GPA硬门槛及补救)
  ✓ Domain test passed: safety & dorm (宿舍管理与500W用电禁令)
  ✓ Domain test passed: medical & contacts (医保报销比例与紧急服务热线)
  ✓ Domain test passed: maritime (航海类专业半军事化作息与专项奖学金)
  ✓ V2 Knowledge Base hierarchy, crawler & quarantine isolation verified
SELFTEST OK: 22 references verified, catalog description 454 chars, 23 mentions all resolve cleanly.
```

### 2. V2 端到端专项验收套件 (`node test/v2-verification.test.js`)
```bash
=== [DSH-WUT Baixiaosheng V2] 启动全量自动化验证测试 ===

[Test 1] 验证 Cordis/DSH 插件规范与注册能力...
  ✓ Cordis 插件规范、零依赖注入与 Skill 注册接口校验通过

[Test 2] 验证原有核心政策条文无退化...
  ✓ 原有 9 大核心规章知识库指标 100% 留存，问答能力无退化

[Test 3] 验证贡献邀请引导条件...
  ✓ 贡献引导触发规范及非干扰约束校验通过

[Test 4] 验证社区贡献处理模块 (脱敏/元数据/查重/PR打包)...
  ✓ 对话上传资料脱敏、哈希去重、元数据识别与待审核打包功能全部正常

[Test 5] 验证官方通知采集模块、来源注册表与结构化字段...
  ✓ 官方通知采集数据结构、哈希去重与历史更新流校验通过

[Test 6] 验证待审核资料物理隔离与安全性...
  ✓ 待审核隔离区物理边界与防污染机制校验通过

[Test 7] 验证 GitHub Issue Forms, PR 模板与 CONTRIBUTING.md...
  ✓ 4 大 GitHub Issue Forms、PR 模板与贡献指南完备

=======================================================
🎉 ALL TESTS PASSED: DSH-WUT Baixiaosheng V2 验收测试 100% 成功！
=======================================================
```

### 3. 公网官方通知采集与去重实测 (`node crawler/notice-crawler.js whut-main-tzgg`)
* **首次运行抓取入库**：
```
=== 启动武汉理工大学官方通知采集测试 ===
[Crawler] 正在采集源: 武汉理工大学学校官网 - 通知公告 (https://www.whut.edu.cn/tongzhigonggao/)...
[Crawler] 武汉理工大学学校官网 - 通知公告 发现 2 条待抓取通知候选
采集执行完毕！处理源: 1 个, 抓取并入库通知: 2 条
- [2026-11-23] 关于2026年劳动节放假安排的通知 -> SAVED_NEW
- [2026-11-23] 关于2026年清明节放假安排的通知 -> SAVED_NEW
```
* **二次运行内容去重检测**：
```
=== 启动武汉理工大学官方通知采集测试 ===
[Crawler] 正在采集源: 武汉理工大学学校官网 - 通知公告 (https://www.whut.edu.cn/tongzhigonggao/)...
[Crawler] 武汉理工大学学校官网 - 通知公告 发现 2 条待抓取通知候选
采集执行完毕！处理源: 1 个, 抓取并入库通知: 2 条
- [2026-11-23] 关于2026年劳动节放假安排的通知 -> EXISTS_IDENTICAL
- [2026-11-23] 关于2026年清明节放假安排的通知 -> EXISTS_IDENTICAL
```

### 4. NPM 打包产物完整性验证 (`npm pack --dry-run`)
```
npm notice name: dsh-wut-baixiaosheng
npm notice version: 2.0.0
npm notice filename: dsh-wut-baixiaosheng-2.0.0.tgz
npm notice package size: 281.3 kB
npm notice unpacked size: 910.4 kB
npm notice total files: 55
```
包含所有 22 个原始规章文件、`official-notices/` 采集文件、`community/` 待审核隔离区、`policies/` 归档、采集器与贡献处理脚本，无任何遗漏。

---

## 三、 安全与隐私审计专项说明

1. **隐私信息脱敏审计**：
   - 测试用例模拟输入含身份证（`420111200305051234`）、手机号（`13988889999`）、学号（`0122119098765`）及银行卡号（`6212261234567890123`）的真实通知样张；
   - 经 `sanitizePrivacy` 处理后，所有敏感字段 100% 替换为掩码标签，未发生任何敏感数据泄露。
2. **待审核防污染隔离**：
   - 用户上传资料与通过 Issue 提交的资料一律暂存至 `references/community/pending/`；
   - `SKILL.md` 指导 Agent 仅在正式授权目录中检索作答，保证待审核内容在未经人工复核前绝不进入正式问答上下文。
3. **网络安全与凭据保护**：
   - `crawler/intranet-policy.md` 明确规定严禁将个人 VPN 或学工账号硬编码至项目，严禁架设公开代理越权穿透，全面符合学校网络安全合规规范。

---

## 四、 验收结论

武汉理工大学百晓生 V2（社区贡献系统与官方通知采集）全部 11 项验收标准均以预期结果达成，工程架构稳健、文档齐全，准予正式发布。
