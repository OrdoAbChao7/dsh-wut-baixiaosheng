# 武汉理工大学官方公开通知知识库 (Official Notices)

本目录由官方通知自动采集器（Crawler）定期抓取并维护，按发布机构分为 5 大子目录：
- `school/`：武汉理工大学学校官网综合通知公告
- `undergraduate-school/`：本科生院（教务处）教学运行、考试排考、选课通知等
- `student-affairs/`：党委学生工作部（处）综合测评、奖助学金评审、宿舍服务等
- `graduate-school/`：研究生院本硕贯通、推免保研通知等
- `colleges/`：各二级教学学院（如计算机、汽车、马院等）转专业细则与分流通知

## 通知数据元信息规范
每个通知条目必须包含以下结构化字段：
- `title`：通知标题
- `source`：发布部门/网站名称
- `source_url`：官方原始 URL
- `publish_date`：官方发布时间
- `crawl_time`：抓取入库时间
- `category`：通知分类（教务/学工/奖助/选课/转专业等）
- `college`：适用学院（全校通用则标为 `all`）
- `applicable_grade`：适用年级（如 `2024级`、`2025级`、`all`）
- `applicable_year`：适用学年（如 `2025-2026-1`）
- `content`：通知纯文本或 Markdown 内容
- `content_hash`：SHA-256 内容哈希（用于去重与更新检测）
- `verification_status`：官方抓取核实状态 (`OFFICIAL_VERIFIED`)
