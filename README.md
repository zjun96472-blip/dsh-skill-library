# dsh-skill-library

个人 DeepSeek Harness 工作台的**「能力库」独立包**：把技能卡片墙**单独做成一页**。

- 左侧边栏多一个**「能力库」**入口，中间栏**只有**技能卡片墙：每张卡是中文名 + 图标 + 一句话说明 + 当前是否在 `/` 菜单里；
- 卡片上带「加入 / 移出 菜单」按钮与**可直接复制的命令行**（`/skill-menu add|remove <name>`）；
- 卡片内容来自**构建期快照**（客户端读不到文件内容），页面会拿实时目录跟快照做**体检**，数量对不上就提示重跑。

**只注册自己这一页的插槽**（这个包里**只有能力库这一页**；工作台首页里那块技能卡片墙是 `dsh-workbench-home` 自己的副本，两者互不引用）：

| 插槽 | key / id | 渲染什么 |
| --- | --- | --- |
| `sidebar.panellist` | `workbench-skill-library` | 左侧「能力库」入口图标 |
| `main` | `workbench-skill-library` | 能力库页（技能卡片墙） |

## 装

```bash
dsh plugin --profile <profile> add /abs/path/to/dsh-skill-library
dsh plugin --profile <profile> add github:<owner>/dsh-skill-library
```

**装完重启一次**才生效（主机插件与客户端 bundle 都是启动时读的）。
**出厂为空**：不含任何个人数据（技能快照是空壳，装好后自己灌一次，见下）。

## config

```yaml
- id: skill-library
  name: dsh-skill-library
  config:
    dshHome: ""      # 留空 = 按官方口径解析（$DSH_HOME > <安装根>/data > ~/.dsh）
```

**没有页面开关**：这个包只有能力库这一页，装上就是这一页。
`skillsDir` 由主机半边通过官方 `webserver/index-inject` 注入成页面全局量 `__DSH_WORKBENCH_LIBRARY__`
（客户端读不到 row config，只能走这条官方通道）。**改完 config 要重启才生效。**

## 页面快照（技能卡片上那句话从哪来）

页面上「这个技能是干什么的」来自**构建期烘进 `lib/client.js` 的快照**（客户端读不到文件内容）。
本包出厂时快照是**空的**（不含任何个人内容），跑一次就灌自己的：

```bash
DSH_HOME=/path/to/data node tools/refresh-snapshots.mjs
```

跑完重启（或至少刷新页面）。页面会拿实时目录跟快照做体检，数量对不上会提示重跑 —— 不假装信息是最新的。

## 与其它三个单页包的关系：**可以同时装**

本套四个单页包（`dsh-workbench-home` / `dsh-workbench-memory` / `dsh-plan-book` / `dsh-skill-library`）
**各自独立**：一个包 = 自己的客户端 bundle（只含自己那一页的组件/CSS/字典）+ 自己那几处插槽 + 自己的插件名与
locale 命名空间。四个一起装的结果是：侧边栏多出四个入口（工作台 / 试作 / 记忆库 / 能力库），计划视图挂在对话尾与右侧大框，
**没有任何一格被覆盖、也没有重复入口**。

为什么能这样：客户端 bundle 是**自包含**的（要用到的图标/工具函数/令牌按需复制一份进来，不共享运行时）；
插槽 key 各用各的（见上面那张表），四个包两两之间没有同名 key。
上一版是"同一份整页代码复制四份、靠主机下发的 `pages` 开关只开一页"——几个包一起装会同时注册同一批 key、
并且互相覆盖开关，那个做法已经删掉（`pages.*` 这个配置项**不再存在**）。

**唯一不要混装的是合集包**：`dsh-workbench-personal`（仓库 `dsh-workbench-personal` / 本工作区 `plugin-repo/`）
是把这几页装在**一个包**里的形态，它注册的是同一批 key —— 合集包与任何单页包**同时装会撞 key**
（同一个 `sidebar.panellist` id / `main` key 被两个插件各注册一次 → 侧边栏出现重复入口）。
这是正常的生态规则：**要么装合集，要么装单页包，不要混**。

## 许可

MIT（见 `LICENSE`）。
