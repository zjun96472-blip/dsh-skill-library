# dsh-skill-library

个人 DeepSeek Harness 工作台的**「能力库」独立包**：把技能卡片墙**单独做成一页**。
装上并重启后，左侧多一个**「能力库」**入口，中间栏只有这一块内容：

- 技能**卡片墙**：中文名 + 图标（有生图图标就显示，没有就自绘线稿）+ 一句话说明 + `/` 菜单状态；
- **搜索框**与**分类筛选**（按技能名前缀分组，稳定的哈希配色）；
- 点开一张卡看它**怎么用**（描述 / 何时使用 / 正文摘要 / 文件路径），手风琴式一次只开一张；
- 每条技能给出 `/skill-menu add|remove <name>` 命令与「加入 / 移出 菜单」按钮，
  按钮通不了就**把命令复制到剪贴板**并说明原因（不会白点、也不会误发一条消息）；
- 快照体检：实时目录数量与构建期快照数量不一致时**明确提示重跑索引**，不假装信息是最新的。

## 页面开关用**新键** `skillLibrary`

合集包里「能力库」只是工作台页（`home`）里的一个板块；本包把它**提成独立页**，所以用的不是
`home` / `memory` / `audition` / `planBook` 那四个旧键，而是第 5 个键 **`skillLibrary`**：

```yaml
- id: skill-library
  name: dsh-skill-library
  config:
    dshHome: ""
    pages:
      home: false
      memory: false
      audition: false
      planBook: false
      skillLibrary: true     # ← 本包唯一打开的那一页
```

其余四项显式 `false` —— 本包**不占**那三页的任何插槽。**改完 config 要重启才生效。**

## 装

```bash
dsh plugin --profile <profile> add /abs/path/to/dsh-skill-library
dsh plugin --profile <profile> add github:<owner>/dsh-skill-library
```

装完**必须重启一次**：主机插件代码与客户端 bundle 都是启动时读的。

前置：

| 需要什么 | 说明 |
| --- | --- |
| **pnpm** | `dsh plugin add` 内部转发给 pnpm。 |
| Web profile | 客户端半边要 `webServer`（`dsh-web-app`）。没有 web 的 profile 也装得下，只是没有页面。 |
| `$DSH_HOME` | 技能目录按官方口径解析（config 的 `dshHome` > `$DSH_HOME` > `<安装根>/data` > `~/.dsh`）。 |
| 技能库（可选） | `$DSH_HOME/skills/<name>/SKILL.md`。没有就显示空状态，不报错。 |
| Node | 本包 `dependencies` 为空。 |

## 页面快照

卡片上「这个技能是干什么的」来自**构建期烘进 `lib/client.js` 的快照**（客户端读不到文件内容，只能注入）。
本包出厂时快照是**空的**（不含任何个人内容），跑一次就灌自己的：

```bash
DSH_HOME=/path/to/data node tools/refresh-snapshots.mjs --skills
```

> 注意：`SKILL.md` 的 frontmatter 必须有 `name` + `description`，否则 harness 会**静默忽略**该文件；
> 本脚本遇到缺 `description` 的技能会**直接报错**（宁可吵，不许静默丢）。

## 别同时装的东西

### ① 本套其它三个拆分包（**不要同时装**）

`dsh-workbench-memory` / `dsh-plan-book` / `dsh-workbench-home` 与本包**共用同一份客户端代码**，
靠各自下发的 `pages` 开关决定注册哪几页。两个一起装会撞在**同一个全局量**上 —— 实测表现（隔离实例，两个包同装）：

- `index.html` 里 `__DSH_WORKBENCH__` 被赋值**两次**（后装的包在后），浏览器按顺序执行 → **后一条生效**，
  先装那个包的 `pages` 全部失效（谁先装谁的功能消失）。
- 两个客户端 bundle 都会下发，且读**同一份**生效 config → 同一个插槽 id/key 会被两个插件**各注册一次**
  （实测：两个 bundle 各注册 4 处，id/key 完全同名）。官方 `dsh-client-ui-sidebar` 把
  `entriesOfSlot("sidebar.panellist")` 直接列成侧边栏项，所以这种重复会变成重复入口；
  真实浏览器里的最终渲染**我没有实测**（本会话无浏览器控制）。

**要哪个就装哪个。**

### ② 与本套 `dsh-workbench-home` 的分工

`dsh-workbench-home` 的页面里**也有一块能力库**（技能卡片墙是工作台页的一个板块，另有顶部大标题、
统计条与「下一阶段」）。要"只要卡片墙的一页"装本包；要完整工作台页装那个。**别同时装。**

### ③ 原有本地插件 `dsh-workbench-home` / `dsh-workbench-skills`

- `dsh-workbench-home`（旧本地插件）的客户端半边与本包共用代码、注册同名插槽，别同时装；
- `dsh-workbench-skills`（旧本地插件）是**主机侧**把技能注册成 `/` 命令的，与本包**不冲突**：
  本包只画卡片，命令来自那份主机插件 —— 想用「加入 / 移出 菜单」按钮就把它装上。

## 许可

MIT（见 `LICENSE`）。
