# 武汉理工大学白小升 (DSH-WUT Baixiaosheng)

<p align="center">
  <img src="https://img.shields.io/badge/WUT-武汉理工大学-005BAC?style=for-the-badge&logoColor=white" alt="WUT"/>
  <img src="https://img.shields.io/badge/Version-2.0.0-success?style=for-the-badge" alt="Version 2.0.0"/>
  <img src="https://img.shields.io/badge/Cordis-Compatible-brightgreen?style=for-the-badge" alt="Cordis Plugin"/>
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License MIT"/>
  <img src="https://img.shields.io/badge/Dependencies-Zero-orange?style=for-the-badge" alt="Zero Dependencies"/>
</p>

> 🎓 **武汉理工大学白小升** 是一款专为武汉理工大学（WUT）学生打造的 AI 智能助手 Skill 插件。基于官方权威《2025版 武汉理工大学学生手册.pdf》全量规章校字文件构建，深度支持学籍管理、绩点换算、挂科预警、奖学金评定、处分解除、学士学位授予与宿舍生活规范等全场景。  
> **V2.0** 新增：**学生低门槛三级资料贡献渠道** 与 **官方网站通知自动化定向采集**。

---

## 📑 目录

- [🌟 核心特性](#-核心特性)
- [💻 新电脑快速上手体验指南](#-新电脑快速上手体验指南)
  - [方式一：在任意 AI Coding 工具中直接使用（零安装·即测即用·最推荐）](#方式一在任意-ai-coding-工具中直接使用零安装即测即用最推荐)
  - [方式二：导入为 Antigravity / Claude 全局 Skill](#方式二导入为-antigravity--claude-全局-skill)
  - [方式三：在 DeepSeek Harness (DSH) / Cordis 容器中运行](#方式三在-deepseek-harness-dsh--cordis-容器中运行)
- [💬 常见提问与测试场景 (Prompt 样例)](#-常见提问与测试场景-prompt-样例)
- [📂 知识库架构说明](#-知识库架构说明)
- [🤝 社区贡献指南 (V2.0)](#-社区贡献指南-v20)
- [🕷️ 官方通知自动采集器](#️-官方通知自动采集器)
- [🧪 自动化测试与质量审计](#-自动化测试与质量审计)
- [📜 许可证](#-许可证)

---

## 🌟 核心特性

- 🏛️ **官方溯源·零幻觉**：所有政策条款、处分解除月份、GPA 折算分值均严格对照武汉理工大学最新校字红头公文（校教字、校学字号），标注原始条款依据。
- ⚡ **零外部运行时依赖**：原生纯 JavaScript (ESM) 编写，无需安装庞大的后端数据库或 Node 模块，即插即用。
- 🛡️ **严格待审核物理隔离**：学生社区提交资料进入待审核隔离区（Quarantine），经脱敏与人工核验前绝不污染正式知识库。
- 🤖 **双重调用机制**：同时支持模型自律意图触发（Model-Invocable）与用户指定显式触发（User-Invocable）。

---

## 💻 新电脑快速上手体验指南

无论你在 Windows、macOS 还是 Linux 全新电脑上，只要几步即可轻松体验！

### 方式一：在任意 AI Coding 工具中直接使用（零安装·即测即用·最推荐）

如果你正在使用 **Antigravity / Cursor / VS Code (Cline/Roo Code/Windsurf)** 等 AI 编程助手：

1. **克隆仓库到本地**：
   ```bash
   git clone https://github.com/OrdoAbChao7/dsh-wut-baixiaosheng.git
   cd dsh-wut-baixiaosheng
   ```
2. **在对话中直接体验**：
   在 AI 对话框中输入：
   > 引用 `@SKILL.md`，你现在扮演武汉理工大学白小升。请回答：**在桌椅或身体上写公式小抄属于什么处分？会直接开除学籍吗？**

3. **效果**：
   AI 会自动解析本知识库条文，准确回答：
   - 属于**记过**处分（处分期10个月）；
   - 该门课程按零分记且不得补考；
   - 明确指出**不会**直接开除学籍（只有代考、组织团伙作弊、使用通信设备传题或三次违规才会开除学籍）。

---

### 方式二：导入为 Antigravity / Claude 全局 Skill

如果你希望任何工程对话中都能随时调用武理工白小升：

1. **复制 Skill 到用户配置目录**：
   - **Windows**：
     ```powershell
     # 创建个人 skills 目录（若无）
     mkdir -Force "$env:USERPROFILE\.gemini\config\skills\wut-baixiaosheng"
     # 拷贝项目文件
     Copy-Item -Recurse -Force .\* "$env:USERPROFILE\.gemini\config\skills\wut-baixiaosheng\"
     ```
   - **macOS / Linux**：
     ```bash
     mkdir -p ~/.gemini/config/skills/wut-baixiaosheng
     cp -r ./* ~/.gemini/config/skills/wut-baixiaosheng/
     ```
2. **生效与使用**：
   重启或开启新对话，当你在对话中提到“*武汉理工*”、“*WUT 选课学分*”、“*挂科退学红线*”等关键词时，AI 将自动激活该 Skill 并依据手册权威作答！

---

### 方式三：在 DeepSeek Harness (DSH) / Cordis 容器中运行

本项目符合 DSH 插件规范与 Cordis 框架标准：

1. **安装本地包**：
   ```bash
   npm install /path/to/dsh-wut-baixiaosheng
   # 或发布至 npm 后运行：pnpm add dsh-wut-baixiaosheng
   ```
2. **在配置文件追加**：
   在你的 Cordis 配置文件（如 `cordis.patch.yml`）中注册：
   ```yaml
   - insert:
       - id: dsh-wut-baixiaosheng
         name: dsh-wut-baixiaosheng
   ```
3. **验证注册**：
   重启容器后，在会话技能目录中查看 `wut-baixiaosheng` 技能状态为 `Active` 即可。

---

## 💬 常见提问与测试场景 (Prompt 样例)

你可以在终端或对话中输入以下问题，测试白小升的抗混淆与精确回答能力：

| 领域 | 提问示例 (直接复制到对话框) | 考察要点 / 预期标准答案 |
|---|---|---|
| **GPA计算** | *“我考了85分，五级制优秀各算多少绩点？补考通过后算多少？”* | 85分对应3.5绩点；五级优秀为4.5；补考合格成绩记60分，绩点**一律按 1.0** 计算。 |
| **学位门槛** | *“大四毕业必修课 GPA 只有 1.8，拿不到学位证怎么办？有补救机会吗？”* | 必修GPA硬门槛为2.0；**千万不能直接办离校**，必须申请**暂不毕业延长学习1年**重修提分！ |
| **挂科退学** | *“单学期挂科多少学分会被学业预警？累计多少学分会退学？”* | 单学期不足14分或必修不及格累计达14分给预警；警示2次以上且不及格必修累计**达30分**退学。 |
| **奖学金兼得** | *“我同时入选了国家奖学金和校一等奖学金，可以兼得领双份钱吗？”* | **绝对互斥，不可兼得**！国奖、励志奖与校奖同一学年只能择一；但卓越奖可与国奖兼得。 |
| **宿舍安全** | *“宿舍可以使用大功率吹风机或电煮锅吗？限额是多少瓦？”* | 严禁使用**超过 500W** 的大功率电器；违者视情节给予警告直至留校察看处分。 |
| **申诉时限** | *“收到处分决定书后不服，多少天内可以提起申诉？向哪个部门提？”* | 必须在收到决定书 **10日内** 提出；受理机构为学生申诉处理委员会（挂靠校团委）。 |

---

## 📂 知识库架构说明

```
dsh-wut-baixiaosheng/
├── SKILL.md                          # Skill 核心描述、触发词及检索索引总表
├── index.js                          # Cordis 插件挂载入口 (apply) 及自检脚本
├── package.json                      # 模块声明 (v2.0.0, zero-dep)
├── cordis.patch.yml                  # Cordis 注册切片
├── CONTRIBUTING.md                   # 社区贡献完整指南
├── references/                       # 核心规章与结构化知识库
│   ├── xueji-guanli-guiding.md       # 学籍管理 (最长在校年限、选课15-35学分、考勤)
│   ├── xuefen-jidian-jisuan.md       # 5.0制GPA换算、补考重修绩点1.0、免修免听
│   ├── xueye-yujing-tuixue.md        # 14分学业警示、降级标准、12种法定退学情形
│   ├── xueshi-xuewei-shouyu.md       # 学位GPA 2.0硬指标、暂缓毕业延长1年补救
│   ├── weiji-chufen-banfa.md         # 5类处分种类、6-12个月解除时限与闭环程序
│   ├── kaoshi-weigui-chuli.md        # 违纪(严重警告)/作弊(记过/留校察看)/开除学籍红线
│   ├── jiangxuejin-pingding.md       # 国奖/励志/校奖/卓越奖金及互斥兼得规则
│   ├── xuesheng-shensu-banfa.md      # 10日申诉时限、15日复查、挂靠校团委办公室
│   ├── xiaoyuan-shenghuo-anquan.md   # 宿舍管理、500W用电禁令、晚归与违规扣分
│   ├── official-notices/             # 官方定向采集公开通知归档
│   │   ├── school/                   # 武汉理工大学官网通知
│   │   ├── undergraduate-school/     # 本科生院通知
│   │   └── history/                  # 历史版本备份 (支持比对追踪)
│   └── community/                    # 学生贡献区
│       ├── pending/raw/              # 待审核隔离区 (Raw 文件)
│       └── approved/                 # 经审核合并的经验与资料
├── community/
│   └── contribution-processor.js     # 隐私脱敏、哈希去重、元数据提取处理模块
└── crawler/
    ├── sources.json                  # 官方公开渠道来源注册表
    ├── notice-crawler.js             # 增量爬虫实现 (SHA-256防重、自动归档)
    └── intranet-policy.md            # 校园网受限数据合规采集守则
```

---

## 🤝 社区贡献指南 (V2.0)

我们支持三种不同门槛的资料贡献方式：

1. **通道一：直接向 Agent 上传文件（零门槛）**  
   直接向对话发送 PDF / Word / 图片 / TXT，Agent 会自动提取文本、打码脱敏学生隐私、提取学院与年份，生成规范待审稿。
2. **通道二：GitHub Issue 快速提交**  
   前往 [GitHub Issues](https://github.com/OrdoAbChao7/dsh-wut-baixiaosheng/issues/new/choose) 填写预设表单：
   - 📄 校园资料提交
   - 🔍 政策制度纠错
   - ⏰ 过期通知提报
   - 💡 经验贴分享
3. **通道三：标准 Pull Request**  
   详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 🕷️ 官方通知自动采集器

项目内置开箱即用的官方网站公开通知采集工具：

```bash
# 查看支持的官方来源列表
node crawler/notice-crawler.js --list

# 运行采集指定官方渠道 (如学校主页通知公告)
node crawler/notice-crawler.js whut-main-tzgg

# 运行采集本科生院通知公告
node crawler/notice-crawler.js whut-ug-tzgg
```

- 采用 SHA-256 内容哈希防重；
- 检测到通知变动时，旧版本自动归档至 `references/official-notices/history/`；
- 遵循《校园网内网访问安全规范》，杜绝泄露个人 VPN 或校园网账户。

---

## 🧪 自动化测试与质量审计

你可以随时运行项目内置的完整测试集：

```bash
# 1. 运行核心架构与 9 大规章指标一致性自检
npm test

# 2. 运行 V2 专项验收测试（覆盖注册、脱敏、去重、隔离区安全等 7 个维度）
node test/v2-verification.test.js
```

**测试通过标准：**
- ✅ `SELFTEST OK`: 22 个 references 文件验证无遗漏，描述 $\le 500$ 字；
- ✅ `ALL TESTS PASSED`: 7 大测试套件全部通过（Exit Code 0）。

---

## 📜 许可证

本项目依据 [MIT License](LICENSE) 开源发布。所有规章原始依据归武汉理工大学校方所有。
