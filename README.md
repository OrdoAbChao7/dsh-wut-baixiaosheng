# dsh-wut-baixiaosheng

武汉理工大学百晓生知识库 · DeepSeek Harness (DSH) / Cordis 插件。基于《2025版-武汉理工大学学生手册.pdf》官方权威文本构建，涵盖学籍管理、学分与GPA绩点计算、转专业、免听免修、休学复学、学业警示与退学、学士学位授予与毕业、学生违纪处分、考试违规与作弊判定、学生申诉流程、综合素质测评规范、各类奖学金评定与资助贷款、校园安全与宿舍管理、航海类半军事化管理等核心规范，作为一个技能插件注册进 DSH 技能目录。

纯数据插件：无网络、无子进程、零外部运行时依赖，随包提供结构化 Markdown 专题规范与全量原始汇编文档。

## 安装

桌面端「设置 → 插件 → 插件终端」执行（包发布到 npm 后）：

```bash
pnpm add dsh-wut-baixiaosheng
```

或在 profile 目录放置本目录后，在 `cordis.patch.yml` 追加：

```yaml
- insert:
    - id: dsh-wut-baixiaosheng
      name: dsh-wut-baixiaosheng
```

重启会话后技能目录出现 `wut-baixiaosheng` 即生效。

## 目录结构

- `SKILL.md`：技能清单、YAML 元数据、知识库路由索引表、Agent 调用指南及核心四大领域高频 Q&A 速查。
- `references/`：结构化知识库，分为两层：
  - **模块化专题 Markdown 文件 (`*.md`)**：16 篇高密度专题规范，提炼具体条款、计算公式、量化门槛与操作流程。
  - **全量原始文本汇编文件 (`*_all.txt` 及全景文)**：6 篇按板块归类的完整规章汇编，支持深度条文追溯与原样引用。
- `index.js`：Cordis 插件接入点 (`apply(ctx)`)，同时提供无依赖自检脚本 (`node index.js --selftest`)。
- `cordis.patch.yml`：Cordis 插件 bundle layer 注册配置。

## 自动化测试与完整性自检

运行项目内建自检脚本：

```bash
npm test
# 或
node index.js --selftest
```

自检内容包括：
1. `SKILL.md` YAML Frontmatter 格式合规性与 catalog description 长度限制（≤ 500 字符）；
2. `cordis.patch.yml` 与 `package.json` 配置一致性；
3. `references/` 目录文件与 `SKILL.md` 索引表双向完整映射（零遗漏、零冗余）；
4. 所有 Markdown 相对链接与锚点有效性；
5. 学籍学分、违纪处分、评奖评优、毕业学位四大领域自动化断言测试。

## 依据与版本

数据源基于武汉理工大学官方《2025版学生手册》（校字公文与规范制度最新合订本）。

MIT License.
