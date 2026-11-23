# DSH-WUT Baixiaosheng V2 架构与实现设计方案 (PROJECT_V2.md)

> **版本**：v2.0.0  
> **更新日期**：2026-11-23  
> **目标工程**：`e:\github项目\dsh-wut-baixiaosheng`  
> **设计原则**：保持 Cordis/DSH 插件规范与零外部依赖，不重写核心插件，不引入复杂后端，实现社区资料贡献与官方通知采集能力。

---

## 一、 背景与演进目标

在 V1 阶段，`dsh-wut-baixiaosheng` 成功实现了以《2025版-武汉理工大学学生手册.pdf》为基础的静态全领域规章知识库与 5.0 GPA 换算、处分申诉等权威问答。进入 V2 阶段，为解决“学校各学院细则分散、官方通知常态化更新、学生手头最新资料缺乏低门槛沉淀通道”等痛点，增加两大核心能力：

1. **学生自主贡献系统**：在对话中适时引导贡献，支持上传多格式资料（PDF/Word/图片/Excel等）并全自动脱敏、排重、生成标准 PR 包；同时提供 GitHub Issue Forms 网页提交入口。
2. **官方公开通知自动采集系统**：建立统一来源注册表，定时或按需抓取武汉理工大学学校及二级学院公开通知，支持内容哈希去重、历史版本快照归档与失效链接检测。

---

## 二、 整体架构设计与模块拓扑

```mermaid
flowchart TD
    subgraph Host["Cordis / DeepSeek Harness (DSH)"]
        CTX["Cordis Context (ctx.skills)"]
        AGENT["大模型 Agent 对话推理"]
        USER["普通学生用户"]
    end

    subgraph PluginCore["DSH-WUT Baixiaosheng V2 插件核心"]
        INDEX["index.js (原生 ESM / 零运行时依赖)"]
        SKILL["SKILL.md (v2.0.0 触发引导与知识路由)"]
        PKG["package.json & cordis.patch.yml"]
    end

    subgraph CommunityPipeline["社区资料贡献流水线 (community/)"]
        PROC["contribution-processor.js"]
        B1["B1 对话多格式上传 (PDF/DOCX/IMG/XLSX)"]
        B2["B2 GitHub Issue Forms (4类结构化表单)"]
        B3["B3 标准 PR 流程 (CONTRIBUTING.md)"]
        SAN["隐私脱敏器 (身份证/手机/学号/银行卡掩码)"]
        HASH_DEDUP["SHA-256 去重检测"]
    end

    subgraph CrawlerModule["官方通知采集引擎 (crawler/)"]
        CRAWLER["notice-crawler.js"]
        REGISTRY["sources.json (来源注册表)"]
        POLICY["intranet-policy.md (校园网合规规范)"]
        SNAP["更新检测与历史快照 (history/)"]
    end

    subgraph KnowledgeBase["分层知识库体系 (references/)"]
        POLICIES["policies/ (学生手册官方核心规章)"]
        OFFICIAL["official-notices/ (官网/本科生院/学工部/各学院)"]
        subgraph Quarantine["待审核物理隔离区"]
            PENDING["community/pending/ (未审核隔离)"]
            RAW["community/pending/raw/ (原始附件)"]
        end
        APPROVED["community/approved/ (审核通过正式收录)"]
        ARCHIVED["community/archived/ (失效历史归档)"]
    end

    INDEX -->|apply(ctx)| CTX
    INDEX -->|加载| SKILL
    SKILL -->|指引问答与条件邀请| AGENT
    USER <-->|对话交互/上传文件| AGENT

    AGENT -->|调用处理| PROC
    B1 --> PROC
    B2 --> PENDING
    B3 --> APPROVED
    PROC --> SAN
    PROC --> HASH_DEDUP
    PROC -->|安全隔离落盘| PENDING
    PROC -->|归档原件| RAW

    CRAWLER -->|读取| REGISTRY
    CRAWLER -->|公网抓取| OFFICIAL
    CRAWLER -->|更新归档| SNAP
    POLICY -.->|指导受限源| CRAWLER

    AGENT -->|仅检索正式库| POLICIES
    AGENT -->|仅检索正式库| OFFICIAL
    AGENT -->|仅检索正式库| APPROVED
    AGENT -.->|严禁直接读取| PENDING
```

---

## 三、 功能 A & B：社区贡献体系设计

### 1. 问答中的贡献邀请行为规范 (SKILL.md)
* **四项专属触发条件（严格限制，非每次出现）**：
  1. 当前问题缺少对应学院资料（如询问某学院未收录的具体转专业考题、夏令营细则）；
  2. 知识库现有政策可能面临过期（如用户提及 2026 最新变动）；
  3. 用户主动提供了尚未收录的新通知文本线索；
  4. 用户主动询问“如何给百晓生贡献资料/如何更新”。
* **标准引导话术**：
  > 「如果你手头有这方面的学校通知、学院文件或课程资料，可以直接上传给我。我可以帮你提取、整理，并生成 GitHub 贡献内容，让更多武理工同学受益。」

### 2. 三级贡献渠道
* **B1：对话直接上传（零门槛）**：
  - 支持格式：PDF、DOC/DOCX、图片、Markdown、TXT、XLSX；
  - 自动化处理流水线（`community/contribution-processor.js`）：
    1. 格式识别与文本提取；
    2. 自动元数据提取（所属学院、发布年份、适用年级、资料类型）；
    3. **自动个人隐私脱敏**：彻底掩码 18 位身份证号、11 位手机号、13 位武理工学号、16-19 位银行卡号；
    4. 内容 SHA-256 哈希计算与全库排重；
    5. 生成待审核摘要 Markdown 并物理落盘至 `references/community/pending/`；
    6. 保存原始文件至 `references/community/pending/raw/`；
    7. 输出标准化 GitHub PR 指引，无需用户手动编辑 Markdown。
* **B2：GitHub 网页 Issue 表单（低门槛）**：
  - `.github/ISSUE_TEMPLATE/submit-material.yml`（提交校园资料）
  - `.github/ISSUE_TEMPLATE/policy-fix.yml`（提交政策纠错）
  - `.github/ISSUE_TEMPLATE/outdated-notice.yml`（提交过期通知）
  - `.github/ISSUE_TEMPLATE/experience-share.yml`（提交经验分享）
  - `.github/ISSUE_TEMPLATE/config.yml`（统一引导页）
* **B3：标准 Pull Request（高阶开发者）**：
  - 完备的 `CONTRIBUTING.md` 贡献指南；
  - 标准化 `.github/pull_request_template.md` 与合规审核清单（Checklist）。

---

## 四、 功能 C & D：官方通知自动采集与合规规范

### 1. 采集模块架构 (`crawler/`)
* **统一来源注册表 (`crawler/sources.json`)**：
  - 包含学校官网、本科生院、学工部、研究生院、计算机学院、网信中心等核心机构；
  - 登记字段：`id`, `name`, `domain`, `section_url`, `base_url`, `category`, `crawl_method`, `update_frequency`, `access_level`, `access_status`, `last_crawl_time`。
* **通知数据标准化字段 (Schema)**：
  - `title`, `source`, `source_url`, `publish_date`, `crawl_time`, `category`, `college`, `applicable_grade`, `applicable_year`, `content`, `content_hash`, `verification_status`。
* **核心机制**：
  - **哈希去重**：以正文 SHA-256 哈希为准，相同内容不重复保存；
  - **版本快照更新**：若同名通知 URL 内容更新，将旧版本自动移至 `references/official-notices/history/` 留存历史沿革；
  - **失效链接检测**：支持 HTTP HEAD/GET 状态码探测。

### 2. 校园网 IP 限制处理策略 (`crawler/intranet-policy.md`)
* **合规红线**：
  1. 严格遵守学校网络管理规定，公网采集设置请求延时与超时；
  2. 针对受校园网 IP 或 SSO 限制的站点，**严禁将个人 VPN 密码、统一身份认证凭据写入公开仓库**；
  3. **严禁私自搭建公共代理穿透内网**；
  4. 优先走官方 API、RSS 订阅或经授权的校园网轻量采集器模式；
  5. 无法自动采集的受限来源，保留人工对话上传或 Issue 上传通道；
  6. 内网站点访问失败时不阻塞其他公网站点的正常抓取（故障隔离）。

---

## 五、 知识库物理隔离与质量安全设计

### 1. 物理目录结构
```
references/
├── *.md / *.txt             # V1 核心规章基准
├── policies/                # 规章专题官方归档
├── official-notices/        # 官方抓取公告
│   ├── school/
│   ├── undergraduate-school/
│   ├── student-affairs/
│   ├── graduate-school/
│   ├── colleges/
│   └── history/
└── community/               # 社区贡献流
    ├── pending/             # ⚠️ 待审核隔离区（严禁大模型直接引入正式问答）
    │   └── raw/             # 原始文件留存
    ├── approved/            # 审核通过正式收录
    └── archived/            # 过期历史归档
```

### 2. 待审核防污染隔离机制
* `references/community/pending/` 被明确定义为隔离区，未审核资料不具备法律效力；
* 必须由仓库维护者执行四项审查（真实性、脱敏完整性、非主观包装、时效冲突）后，方可移动至 `approved/` 并更新知识库索引。

---

## 六、 兼容性与自测保证

1. **零外部生产依赖**：整个插件保持 `package.json` 中的 `dependencies: {}`，完全依托 Node.js 原生标准库运行。
2. **Cordis/DSH 注册兼容**：原有 `apply(ctx)` 逻辑保持不变，`SKILL.md` 描述控制在 454 字符（$\le 500$ 规范）。
3. **自动化测试套件**：
   - `npm test`（`node index.js --selftest`）：9 大核心领域自测 100% 通过；
   - `node test/v2-verification.test.js`：端到端全量 V2 能力测试通过；
   - `npm pack --dry-run`：全部 55 个生产文件完整打入 tarball。
