// dsh-skill-library —— 客户端半边（能力库独立页）
//
// 页面：左侧「能力库」入口，一页只有技能卡片墙（中文名 / 图标 / 一句话说明 / 加入菜单命令）。
//
// 本文件**只含自己那一页**的组件、CSS 与字典 —— 客户端 bundle 是自包含的，不与其它包共享运行时
// （要用到的图标/工具函数/令牌按需复制一份进来）。
// 插槽注册只做自己那几处 key（见下面的 apply），所以四个包同时装也不会互相覆盖、不会出现重复入口。
// 模块 id 必须等于包名（加载器按包名 require）；插件名与 locale 命名空间也一包一个，互不重名。
window.__ModuleLoader__.load({
	id: "dsh-skill-library",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		const React = require("react");
		const h = React.createElement;

		/** 客户端插件名（cordis 插件体 name）：与其它三个包**不重名**。 */
		const PLUGIN_NAME = "skill-library";
		/** locale 命名空间：一包一个，字典不互相覆盖。 */
		const LOCALE_NS = "skill-library";
		/** 侧边栏入口图标插槽（list）与中间栏面板插槽（keyed）的注册键必须同名。 */
		const PANEL_SLOT = "sidebar.panellist";
		const MAIN_SLOT = "main";
		/** 「能力库」页的插槽 id / main key（独立页，不复用工作台页的 key）。 */
		const PANEL_KEY_LIBRARY = "workbench-skill-library";
		/** 本包主机半边注入的路径（客户端拿不到 row config，只能走这条路）；桩测里没有它就退回默认。 */
		const HOST_PATHS = globalThis.__DSH_WORKBENCH_LIBRARY__ !== null && typeof globalThis.__DSH_WORKBENCH_LIBRARY__ === "object" ? globalThis.__DSH_WORKBENCH_LIBRARY__ : {};
		const SKILLS_DIR = typeof HOST_PATHS.skillsDir === "string" && HOST_PATHS.skillsDir !== "" ? HOST_PATHS.skillsDir : "/opt/deepseek-harness-personal/data/skills";

		const DICT_ZH = {
			"panel.label": "工作台",
			"lib.title": "能力库",
			"lib.hint": "可复用的流程。说到相关的事，我会自动加载；点开能看它做什么、什么时候用、怎么用。",
			"lib.search": "搜索技能（名字或用途）",
			"lib.loading": "正在读取技能目录…",
			"lib.empty": "还没有技能",
			"lib.empty.hint": "把做法写成 data/skills/<名字>/SKILL.md 就会出现在这里",
			"lib.slow": "目录服务还没就绪",
			"lib.slow.hint": "接口要么还没激活，要么不接受这个路径。可以稍等或点刷新。",
			"lib.failed": "读不到技能目录",
			"lib.nomatch": "没有匹配的技能",
			"lib.trigger": "什么时候用",
			"lib.trigger.chip": "触发",
			"lib.what": "它做什么",
			"lib.how": "怎么用",
			"lib.how.value": "说到相关的事我会自动加载；也可以直接点名这个技能。",
			"lib.source": "源文件",
			"lib.unit": "条",
			"lib.generated": "索引生成于",
			"lib.filter.all": "全部",
			"lib.detail": "看详情",
			"lib.cmd.on": "已加入 / 菜单",
			"lib.cmd.off": "未加入 / 菜单",
			"lib.detail.hide": "收起",
			"lib.close": "关闭",
			"lib.drift": "目录里和索引里的条数不一致，索引可能过期 —— 重跑 tools/skill-index.mjs 即可刷新描述。",
			"lib.missing": "索引里还没有这条技能，重跑 tools/skill-index.mjs 就能看到它的说明。",
			"lib.add": "加一条：把做法写成 data/skills/<名字>/SKILL.md（frontmatter 必须有 name 和 description）",
			"action.retry": "重试",
			"action.refresh": "刷新",
		};

		const DICT_EN = {
			"panel.label": "Workbench",
			"lib.title": "Capability library",
			"lib.hint": "Reusable procedures. I load them automatically when they apply; open one to see what it does, when it runs, and how to use it.",
			"lib.search": "Search skills (name or purpose)",
			"lib.loading": "Reading the skills directory…",
			"lib.empty": "No skills yet",
			"lib.empty.hint": "Write a procedure to data/skills/<name>/SKILL.md and it shows up here",
			"lib.slow": "The directory service is not ready",
			"lib.slow.hint": "Either the API is not active yet, or it rejects this path. Wait or press refresh.",
			"lib.failed": "Cannot read the skills directory",
			"lib.nomatch": "No matching skill",
			"lib.trigger": "When it runs",
			"lib.trigger.chip": "trigger",
			"lib.what": "What it does",
			"lib.how": "How to use",
			"lib.how.value": "I load it automatically when the topic comes up — or name the skill directly.",
			"lib.source": "Source",
			"lib.unit": "items",
			"lib.generated": "index generated",
			"lib.filter.all": "All",
			"lib.detail": "Details",
			"lib.cmd.on": "in the / menu",
			"lib.cmd.off": "not in the / menu",
			"lib.detail.hide": "Hide",
			"lib.close": "Close",
			"lib.drift": "Directory and index counts differ — the index may be stale. Re-run tools/skill-index.mjs to refresh descriptions.",
			"lib.missing": "Not in the index yet — re-run tools/skill-index.mjs to get its description.",
			"lib.add": "To add one: write data/skills/<name>/SKILL.md (frontmatter must carry name and description)",
			"action.retry": "Retry",
			"action.refresh": "Refresh",
		};

		/* SKILL-INDEX:BEGIN —— 由 tools/refresh-snapshots.mjs 生成，勿手改；加/改技能后重跑本脚本 */
		/* 空壳快照：本包不含任何个人技能内容；装好后跑 tools/refresh-snapshots.mjs 灌自己的 */
		const SKILL_INDEX = { generatedAt: "", skills: [] };
		/* SKILL-INDEX:END */

		/* ICONS:BEGIN —— 由 tools/gen-icons.mjs 生成（生图 → 96px WebP → base64），勿手改 */
		/* 空壳快照：技能图标 Base64 已清空，卡片退回自绘线稿 */
		const SKILL_ICONS = {};
		/* ICONS:END */

		const PAGE_CSS = [
			".wbh-page{height:100%;overflow:auto;box-sizing:border-box;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family,inherit);font-size:13px;line-height:1.5}",
			".wbh-inner{max-width:940px;margin:0 auto;padding:22px 24px 44px}",
			".wbh-card{margin-top:16px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-lg,10px);background:var(--dsw-alias-bg-layer-1);box-shadow:0 1px 2px rgba(0,0,0,.04),0 14px 36px -22px rgba(0,0,0,.24);animation:wbh-rise .34s cubic-bezier(.22,.8,.3,1) .06s both}",
			".wbh-cardhead{display:flex;align-items:center;gap:8px;padding:13px 18px;border-bottom:1px solid var(--dsw-alias-border-l1)}",
			".wbh-cardicon{flex:none;color:var(--dsw-alias-brand-primary);display:flex}",
			".wbh-cardtitle{font-size:13px;font-weight:600}",
			".wbh-badge{font-size:11px;color:var(--dsw-alias-label-secondary);padding:1px 8px;border-radius:999px;background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.12));border:1px solid var(--dsw-alias-border-l1)}",
			".wbh-spacer{margin-left:auto}",
			".wbh-search{font:inherit;font-size:11px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.08));border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-sm,4px);padding:4px 8px;min-width:180px;outline:none}",
			".wbh-search::placeholder{color:var(--dsw-alias-label-secondary);opacity:.75}",
			".wbh-search:focus{border-color:var(--dsw-alias-brand-primary)}",
			".wbh-ghost{font:inherit;font-size:11px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.1));border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-sm,4px);padding:4px 10px;cursor:pointer;transition:background .15s ease,color .15s ease,border-color .15s ease}",
			".wbh-ghost:hover{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-brand-primary)}",
			".wbh-cardbody{padding:14px 18px 16px}",
			".wbh-hint{margin:0 0 12px;font-size:11px;line-height:1.6;color:var(--dsw-alias-label-secondary)}",
			".wbh-field{font-size:11px;line-height:1.65;color:var(--dsw-alias-label-secondary)}",
			".wbh-field b{color:var(--dsw-alias-label-primary);font-weight:600;display:block;margin-bottom:2px;font-size:10px;letter-spacing:.04em}",
			".wbh-path{font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:10.5px;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere}",
			".wbh-note{margin-top:12px;font-size:10.5px;line-height:1.6;color:var(--dsw-alias-label-secondary);opacity:.9}",
			".wbh-noteinline{position:relative;margin:0;text-align:right;flex:1;min-width:0;overflow-wrap:anywhere}",
			".wbh-warnmargin{margin:0 0 10px}",
			".wbh-filters{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}",
			".wbh-chip{display:inline-flex;align-items:center;gap:6px;font:inherit;font-size:11px;color:var(--dsw-alias-label-secondary);background:transparent;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;padding:3px 10px;cursor:pointer;transition:background .15s ease,border-color .15s ease,color .15s ease}",
			".wbh-chip:hover{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary)}",
			".wbh-chip.is-on{background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.12));border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary)}",
			".wbh-chipdot{width:6px;height:6px;border-radius:50%;flex:none}",
			".wbh-libgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(248px,1fr));gap:12px;align-items:start}",
			".wbh-libcard{position:relative;overflow:hidden;text-align:left;font:inherit;color:inherit;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-lg,10px);padding:14px;cursor:pointer;transition:transform .18s cubic-bezier(.22,.8,.3,1),border-color .18s ease,box-shadow .18s ease}",
			".wbh-libcard:hover{transform:translateY(-3px);border-color:var(--dsw-alias-border-l2);box-shadow:0 14px 34px -18px rgba(0,0,0,.35)}",
			".wbh-libcard.is-open{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 1px var(--dsw-alias-brand-primary) inset}",
			".wbh-libcard::before{content:'';position:absolute;inset:-40% -10% auto -10%;height:120px;pointer-events:none;opacity:.5;background:radial-gradient(60% 80% at 20% 0%,var(--wbh-tint,transparent),transparent 70%)}",
			".wbh-libtile.is-image{background:none;border:none;width:40px;height:40px;padding:0}",
			".wbh-libtile{position:relative;width:38px;height:38px;border-radius:var(--dsw-radius-md,8px);display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.12));border:1px solid var(--dsw-alias-border-l1)}",
			".wbh-libtop{position:relative;display:flex;align-items:center;gap:10px}",
			".wbh-libname{display:block;font-size:13px;font-weight:600;line-height:1.35}",
			".wbh-libid{display:block;margin-top:2px;font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:10px;line-height:1.3;color:var(--dsw-alias-label-secondary);opacity:.75;word-break:break-all}",
			".wbh-libshort{position:relative;margin:11px 0 0;font-size:12px;line-height:1.55;color:var(--dsw-alias-label-primary);opacity:.92}",
			".wbh-cmd{position:relative;display:inline-flex;align-items:center;gap:5px;margin-top:8px;font-size:10px;line-height:1.5;color:var(--dsw-alias-label-secondary);font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace)}",
			".wbh-cmd.is-on{color:var(--dsw-alias-brand-primary)}",
			".wbh-cmddot{width:5px;height:5px;border-radius:50%;background:currentColor;opacity:.75;flex:none}",
			".wbh-cardbtns{position:relative;display:flex;align-items:center;gap:8px;margin-top:10px}",
			".wbh-btn{font:inherit;font-size:11px;font-weight:500;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.12));border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-sm,4px);padding:4px 12px;cursor:pointer;transition:background .15s ease,border-color .15s ease,color .15s ease}",
			".wbh-btn:hover:not(:disabled){border-color:var(--dsw-alias-brand-primary)}",
			".wbh-btn:disabled{opacity:.6;cursor:default}",
			".wbh-btn.is-on{color:var(--dsw-alias-label-secondary);background:transparent}",
			".wbh-cmdline{position:relative;display:flex;align-items:center;gap:8px;margin-top:8px}",
			".wbh-cmdtext{font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:10px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.1));border-radius:var(--dsw-radius-sm,4px);padding:2px 6px;overflow-wrap:anywhere}",
			".wbh-result{font-size:10px;line-height:1.5;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere}",
			".wbh-libmore{position:relative;margin:9px 0 0;display:inline-flex;align-items:center;gap:5px;font-size:10px;color:var(--dsw-alias-label-secondary)}",
			".wbh-backdrop{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(6,8,18,.5);animation:wbh-fade .16s ease-out}",
			".wbh-dialog{width:100%;max-width:600px;max-height:78vh;overflow:auto;box-sizing:border-box;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-panel,16px);box-shadow:0 24px 60px -18px rgba(0,0,0,.5),0 2px 8px rgba(0,0,0,.12);animation:wbh-pop .2s cubic-bezier(.22,.8,.3,1);color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family,inherit)}",
			".wbh-dialoghead{display:flex;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid var(--dsw-alias-border-l1)}",
			".wbh-dialogicon{flex:none;display:flex}",
			".wbh-dialogtitle{display:block;font-size:15px;font-weight:600;line-height:1.3}",
			".wbh-dialoggroup{display:block;margin-top:3px;font-size:10px;letter-spacing:.05em;color:var(--dsw-alias-label-secondary)}",
			".wbh-close{flex:none;margin-left:auto;display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:var(--dsw-radius-sm,4px);border:1px solid var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;transition:background .15s ease,color .15s ease,border-color .15s ease}",
			".wbh-close:hover{background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.12));color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2)}",
			".wbh-dialogbody{padding:16px 18px 18px;display:flex;flex-direction:column;gap:14px}",
			".wbh-skel{display:flex;flex-direction:column;gap:8px}",
			".wbh-skelline{height:26px;border-radius:var(--dsw-radius-md,8px);background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.1));background-image:linear-gradient(90deg,transparent,rgba(127,127,127,.18),transparent);background-size:200px 100%;animation:wbh-shimmer 1.4s linear infinite}",
			".wbh-notice{display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:var(--dsw-radius-md,8px);border:1px dashed var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.06));font-size:11px;line-height:1.6;color:var(--dsw-alias-label-secondary)}",
			".wbh-notice b{font-weight:600;color:var(--dsw-alias-label-primary)}",
			".wbh-page :focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;border-radius:var(--dsw-radius-sm,4px)}",
			"@media (prefers-reduced-motion:reduce){.wbh-heroframe,.wbh-stats,.wbh-card,.wbh-dot,.wbh-skelline,.wbh-backdrop,.wbh-dialog{animation:none !important;transition:none !important}}"
		].join("\n");

		/** 卡片小图标：书（能力库）。 */
		function BookIcon() {
			return h(
				"svg",
				{ width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", style: { display: "block" } },
				h("path", { d: "M4 4.6h6.2c1 0 1.8.8 1.8 1.8v13c0-1-.8-1.8-1.8-1.8H4z", stroke: "currentColor", strokeWidth: "1.6", strokeLinejoin: "round" }),
				h("path", { d: "M20 4.6h-6.2c-1 0-1.8.8-1.8 1.8v13c0-1 .8-1.8 1.8-1.8H20z", stroke: "currentColor", strokeWidth: "1.6", strokeLinejoin: "round", opacity: "0.7" })
			);
		}

		/** 分类小图标：按技能前缀给一个形状，卡片靠图形而不是文字被识别。 */
		function CategoryGlyph(props) {
			const common = { width: 19, height: 19, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", style: { display: "block" } };
			if (props.kind === "workbench") {
				return h("svg", common, h("path", { d: "M4 8.4h16v10.2H4z", stroke: "currentColor", strokeWidth: "1.6", strokeLinejoin: "round" }), h("path", { d: "M9 8.4V6.8A1.8 1.8 0 0 1 10.8 5h2.4A1.8 1.8 0 0 1 15 6.8v1.6", stroke: "currentColor", strokeWidth: "1.6" }), h("path", { d: "M4 12.6h16", stroke: "currentColor", strokeWidth: "1.4", opacity: "0.6" }));
			}
			if (props.kind === "personal") {
				return h("svg", common, h("path", { d: "M12 3.6l8 4.2-8 4.2-8-4.2z", stroke: "currentColor", strokeWidth: "1.6", strokeLinejoin: "round" }), h("path", { d: "M4 12.4l8 4.2 8-4.2", stroke: "currentColor", strokeWidth: "1.6", strokeLinejoin: "round", opacity: "0.7" }), h("path", { d: "M4 16.6l8 4.2 8-4.2", stroke: "currentColor", strokeWidth: "1.6", strokeLinejoin: "round", opacity: "0.4" }));
			}
			if (props.kind === "ui") {
				return h("svg", common, h("circle", { cx: "12", cy: "12", r: "8.2", stroke: "currentColor", strokeWidth: "1.6" }), h("circle", { cx: "9.4", cy: "10" , r: "1.3", fill: "currentColor" }), h("circle", { cx: "14.2", cy: "9.4", r: "1.3", fill: "currentColor", opacity: "0.7" }), h("circle", { cx: "12.4", cy: "14.6", r: "1.3", fill: "currentColor", opacity: "0.45" }));
			}
			return h("svg", common, h("circle", { cx: "12", cy: "12", r: "3", stroke: "currentColor", strokeWidth: "1.6" }), h("path", { d: "M12 3.4v3M12 17.6v3M3.4 12h3M17.6 12h3", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", opacity: "0.6" }));
		}

		/** 关闭图标（弹窗右上角）。 */
		function CloseIcon() {
			return h(
				"svg",
				{ width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", style: { display: "block" } },
				h("path", { d: "M6.5 6.5l11 11M17.5 6.5l-11 11", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" })
			);
		}

		/**
		 * 技能详情弹窗：卡片本身完全不动，详情在这里有足够空间。
		 * 交互：Esc / 点遮罩 / 点右上角 × 关闭；打开时把焦点移到关闭按钮；`prefers-reduced-motion` 下不动画。
		 *
		 * @param props - `skill` 选中的技能行；`t` 文案；`onClose` 关闭回调。
		 */
		function SkillDialog(props) {
			const skill = props.skill;
			const t = props.t;
			const onClose = props.onClose;
			const closeRef = React.useRef(null);
			React.useEffect(() => {
				const onKeyDown = (event) => {
					if (event.key === "Escape") onClose();
				};
				document.addEventListener("keydown", onKeyDown);
				if (closeRef.current !== null && typeof closeRef.current.focus === "function") closeRef.current.focus();
				return () => document.removeEventListener("keydown", onKeyDown);
			}, []);
			const icon = SKILL_ICONS[skill.dir];
			return h(
				"div",
				{ className: "wbh-backdrop", role: "presentation", onClick: onClose },
				h(
					"div",
					{
						className: "wbh-dialog",
						role: "dialog",
						"aria-modal": "true",
						"aria-label": skill.title ?? skill.name,
						onClick: (event) => event.stopPropagation()
					},
					h(
						"div",
						{ className: "wbh-dialoghead" },
						h(
							"span",
							{ className: "wbh-dialogicon" },
							icon
								? h("img", { src: icon, alt: "", width: 46, height: 46, style: { display: "block", borderRadius: "var(--dsw-radius-md,8px)" } })
								: h(CategoryGlyph, { kind: skill.tone })
						),
						h(
							"span",
							{ style: { minWidth: 0, flex: "1 1 auto" } },
							h("span", { className: "wbh-dialogtitle" }, skill.title ?? skill.name),
							h("span", { className: "wbh-libid" }, skill.name),
							h("span", { className: "wbh-dialoggroup" }, skill.group)
						),
						h("button", { ref: closeRef, type: "button", className: "wbh-close", "aria-label": t("lib.close"), title: t("lib.close"), onClick: onClose }, h(CloseIcon, null))
					),
					h(
						"div",
						{ className: "wbh-dialogbody" },
						skill.whenToUse ? h("div", { className: "wbh-field" }, h("b", null, t("lib.trigger")), skill.whenToUse) : null,
						h("div", { className: "wbh-field" }, h("b", null, t("lib.what")), skill.indexed ? skill.description : t("lib.missing")),
						h(
							"div",
							{ className: "wbh-field" },
							h("b", null, t("lib.how")),
							t("lib.how.value"),
							skill.command ? h("span", { className: "wbh-path" }, `　在输入框敲 /${skill.command} 可以直接调用（当前已${t("lib.cmd.on")}）。`) : `　当前${t("lib.cmd.off")}，说一声就加。`
						),
						h("div", { className: "wbh-field" }, h("b", null, t("lib.source")), h("span", { className: "wbh-path" }, skill.path))
					)
				)
			);
		}

		/**
		 * 把列目录的返回值里能用的名字抠出来（返回结构未见确切类型定义，故防御式解析）。
		 * @param listing - listDirectory 的返回值。
		 * @returns 排序去重后的条目名数组。
		 */
		function namesOf(listing) {
			const raw = Array.isArray(listing)
				? listing
				: Array.isArray(listing?.entries)
					? listing.entries
					: Array.isArray(listing?.items)
						? listing.items
						: [];
			const names = raw
				.map((entry) => (typeof entry === "string" ? entry : entry?.name ?? entry?.basename ?? entry?.path ?? ""))
				.map((value) => String(value).replace(/\/+$/, "").split("/").pop() ?? "")
				.filter((value) => value.length > 0 && !value.startsWith("."));
			return [...new Set(names)].sort((a, b) => a.localeCompare(b));
		}

		/**
		 * 把"索引快照 + 实时目录"合成页面要的行：
		 * 索引里有描述的用富行；目录里有但索引没记的用简行（并提示重跑索引）。
		 * @param liveNames - 实时目录里的名字（null = 目录读不到）。
		 * @returns 行数组，按分组与名字排序。
		 */
		function rowsOf(liveNames) {
			// 形状防御：目录服务返回非数组时按"读不到目录"处理（原本会让整页抛错白屏）
			const live = Array.isArray(liveNames) ? new Set(liveNames) : null;
			const rows = SKILL_INDEX.skills
				.filter((skill) => live === null || live.has(skill.name) || live.has(skill.dir))
				.map((skill) => ({ ...skill, indexed: true }));
			if (live !== null) {
				const known = new Set(SKILL_INDEX.skills.flatMap((skill) => [skill.name, skill.dir]));
				for (const liveName of liveNames) {
					if (!known.has(liveName)) {
						rows.push({ name: liveName, dir: liveName, group: "其它", description: "", whenToUse: "", excerpt: "", path: `data/skills/${liveName}/SKILL.md`, indexed: false });
					}
				}
			}
			return rows.sort((a, b) => String(a.group).localeCompare(String(b.group), "zh") || String(a.name).localeCompare(String(b.name)));
		}

		/**
		 * 「能力库」独立页：技能卡片墙（本包自包含的一份副本 —— 不与其它包共享运行时，也不读任何页面开关）。
		 * @param props - `t` 文案；`getDirectory` 取目录调用（未就绪返回 null）；`subscribe` 订阅服务到达；`runToggle` 把命令送进会话。
		 */
		function LibraryPage(props) {
			const t = props.t;
			const getDirectory = props.getDirectory;
			const [attempt, setAttempt] = React.useState(0);
			const [skills, setSkills] = React.useState({ status: "loading", names: null });
			const [query, setQuery] = React.useState("");
			const [open, setOpen] = React.useState("");
			const [tone, setTone] = React.useState("");
			const [copied, setCopied] = React.useState("");
			const [busy, setBusy] = React.useState("");
			// 面板 props 里的 useSessions（官方 hook）：面板自身没有 session，靠它拿会话状态
			const useSessionsHook = typeof props.useSessions === "function" ? props.useSessions : null;
			let panelSessionsState = null;
			try {
				panelSessionsState = useSessionsHook === null ? null : useSessionsHook((state) => state);
			} catch {
				panelSessionsState = null;
			}
			const [notice, setNotice] = React.useState("");
			const [overrides, setOverrides] = React.useState({});
			// 服务迟到绑定：apply 时它可能还没激活，到了就叫醒本页。
			React.useEffect(() => {
				if (getDirectory() !== null) return undefined;
				const notify = () => setAttempt((n) => n + 1);
				return props.subscribe(notify);
			}, []);

			React.useEffect(() => {
				const list = getDirectory();
				if (list === null) {
					setSkills({ status: "slow", names: null });
					return undefined;
				}
				let cancelled = false;
				setSkills({ status: "loading", names: null });
				Promise.resolve()
					.then(() => list(SKILLS_DIR))
					.then((listing) => {
						if (cancelled) return;
						const names = namesOf(listing);
						setSkills({ status: names.length === 0 ? "empty" : "ready", names });
					})
					.catch((error) => {
						if (cancelled) return;
						console.warn(`[${PLUGIN_NAME}] 读取技能目录失败：`, error);
						setSkills({ status: "failed", names: null });
					});
				return () => {
					cancelled = true;
				};
			}, [attempt]);
			const allRows = rowsOf(skills.names);
			const q = query.trim().toLowerCase();
			const rows = q.length === 0 ? allRows : allRows.filter((row) => `${row.title ?? ""} ${row.name} ${row.description} ${row.whenToUse}`.toLowerCase().includes(q));
			const groups = [];
			for (const row of rows) {
				const last = groups[groups.length - 1];
				if (last !== undefined && last.label === row.group) last.rows.push(row);
				else groups.push({ label: row.group, rows: [row] });
			}
			// 类别的配色序号（稳定的哈希 → 4 个色相），让卡片有颜色但不需要读字
			const TONES = ["rgba(96,140,255,.5)", "rgba(140,110,255,.5)", "rgba(255,170,90,.5)", "rgba(80,200,160,.5)"];
			const toneOf = (label) => {
				let sum = 0;
				for (let i = 0; i < label.length; i++) sum = (sum * 31 + label.charCodeAt(i)) % 997;
				return TONES[sum % TONES.length];
			};
			const toneNames = [...new Set(allRows.map((row) => row.group))];
			const shown = tone.length === 0 ? rows : rows.filter((row) => row.group === tone);
			const groups2 = [];
			for (const row of shown) {
				const last = groups2[groups2.length - 1];
				if (last !== undefined && last.label === row.group) last.rows.push(row);
				else groups2.push({ label: row.group, rows: [row] });
			}
			const selected = allRows.find((row) => row.name === open) ?? null;
			const drift = skills.names !== null && SKILL_INDEX.skills.length > 0 && skills.names.length !== SKILL_INDEX.skills.length;
			function commandOf(row) {
				return overrides[row.name] !== undefined ? overrides[row.name] : row.command ?? "";
			}

			/**
			 * 复制一行到剪贴板。
			 * @param line - 要复制的文本。
			 * @param rowName - 哪一行技能（用来显示"已复制"）。
			 * @returns 是否复制成功。
			 */
			async function copyLine(line, rowName) {
				try {
					if (typeof navigator !== "undefined" && navigator.clipboard !== undefined) {
						await navigator.clipboard.writeText(line);
						setCopied(rowName);
						setTimeout(() => setCopied(""), 2500);
						return true;
					}
				} catch {}
				return false;
			}

			/**
			 * 点「加入 / 移出 菜单」：先试把命令送进会话（官方 conversation.send）；
			 * 送不进去就**自动复制**该命令并提示粘贴 —— 无论哪条路，按钮都不会白点。
			 * @param row - 技能行。
			 */
			async function onToggleMenu(row) {
				const current = commandOf(row);
				const line = `/skill-menu ${current ? "remove" : "add"} ${row.name}`;
				setBusy(row.name);
				setNotice("");
				let outcome = { via: "", detail: "" };
				try {
					outcome = await props.runToggle(line, panelSessionsState);
				} catch (error) {
					outcome = { via: "", detail: String(error).slice(0, 80) };
				}
				if (outcome.via !== "") {
					setOverrides((previous) => ({ ...previous, [row.name]: current ? "" : row.name }));
					setNotice(`已发出${current ? "移出" : "加入"}指令（经 ${outcome.via}）。提醒：如果输入框"没把它认成命令"，它会作为一条消息出现在会话里 —— 那种情况下菜单不会变，再点一次。`);
				} else {
					const copied = await copyLine(line, row.name);
					const head = copied ? "四条路都没通，已复制命令，粘到输入框回车即可" : "请手动输入";
					setNotice(`${head}：${line}　（原因：${outcome.detail}）`);
				}
				setBusy("");
			}

			/**
			 * 展开/收起一条技能。
			 * @param skillName - 技能名。
			 */
			function toggle(skillName) {
				// 手风琴：一次只开一张——点开新的会收起旧的，网格不会被撑出一堆高度
				setOpen((current) => (current === skillName ? "" : skillName));
			}

			let body;
			if (skills.status === "ready" || (skills.status === "empty" && SKILL_INDEX.skills.length > 0)) {
				body =
					shown.length === 0
						? h("div", { className: "wbh-notice" }, h("span", null, h("b", null, t("lib.nomatch"))))
						: h(
								"div",
								{ className: "wbh-libgrid" },
								shown.map((row) => {
									const isOpen = open === row.name;
									return h(
										"div",
										{
											key: row.name,
											role: "button",
											tabIndex: 0,
											className: `wbh-libcard${isOpen ? " is-open" : ""}`,
											style: { "--wbh-tint": toneOf(row.group) },
											"aria-expanded": isOpen,
											onClick: () => toggle(row.name),
											onKeyDown: (event) => {
												if (event.key === "Enter" || event.key === " ") {
													event.preventDefault();
													toggle(row.name);
												}
											}
										},
										h(
											"span",
											{ className: "wbh-libtop" },
											h(
												"span",
												{ className: `wbh-libtile${SKILL_ICONS[row.dir] ? " is-image" : ""}` },
												SKILL_ICONS[row.dir]
													? h("img", { src: SKILL_ICONS[row.dir], alt: "", width: 40, height: 40, style: { display: "block", borderRadius: "var(--dsw-radius-md,8px)" } })
													: h(CategoryGlyph, { kind: row.tone })
											),
											h(
												"span",
												{ style: { minWidth: 0 } },
												h("span", { className: "wbh-libname" }, row.indexed ? row.title ?? row.name : row.name),
												h("span", { className: "wbh-libid" }, row.name)
											)
										),
										h("span", { className: "wbh-libshort" }, row.indexed ? row.short : t("lib.missing")),
										h(
											"span",
											{
												className: `wbh-cmd${row.command ? " is-on" : ""}`,
												title: row.command ? `在输入框敲 /${row.command} 就能直接调用它` : "还没加进 / 菜单（跟工作台说一声就加）"
											},
											h("span", { className: "wbh-cmddot", "aria-hidden": "true" }),
											row.command ? `${t("lib.cmd.on")} · /${row.command}` : t("lib.cmd.off")
										),
										h(
											"span",
											{ className: "wbh-cardbtns" },
												h(
													"button",
													{
														type: "button",
														className: `wbh-btn${commandOf(row) ? " is-on" : ""}`,
														disabled: busy === row.name,
														onClick: (event) => {
															event.stopPropagation();
															onToggleMenu(row);
														}
													},
													busy === row.name ? "处理中…" : commandOf(row) ? "移出 / 菜单" : "加入 / 菜单"
												),
										),
										h(
											"span",
											{ className: "wbh-cmdline" },
											h("code", { className: "wbh-cmdtext" }, `/skill-menu ${commandOf(row) ? "remove" : "add"} ${row.name}`),
											notice !== "" ? h("span", { className: "wbh-result" }, notice) : null
										),
										h("span", { className: "wbh-libmore" }, t("lib.detail"))
									);
								})
							);
			} else if (skills.status === "loading") {
				body = h(
					"div",
					{ className: "wbh-skel", role: "status", "aria-label": t("lib.loading") },
					h("div", { className: "wbh-skelline" }),
					h("div", { className: "wbh-skelline", style: { width: "74%" } }),
					h("div", { className: "wbh-skelline", style: { width: "58%" } })
				);
			} else if (skills.status === "empty") {
				body = h("div", { className: "wbh-notice" }, h("span", null, h("b", null, t("lib.empty")), " · ", t("lib.empty.hint")));
			} else if (skills.status === "failed") {
				body = h(
					"div",
					{ className: "wbh-notice" },
					h("span", null, h("b", null, t("lib.failed"))),
					h("span", { className: "wbh-spacer" }),
					h("button", { type: "button", className: "wbh-ghost", onClick: () => setAttempt((n) => n + 1) }, t("action.retry"))
				);
			} else {
				body = h("div", { className: "wbh-notice" }, h("span", null, h("b", null, t("lib.slow")), " · ", t("lib.slow.hint")));
			}
			return h(
				"div",
				{ className: "wbh-page" },
				h(
					"div",
					{ className: "wbh-inner" },
					h(
						"section",
						{ className: "wbh-card" },
						h(
							"div",
							{ className: "wbh-cardhead" },
							h("span", { className: "wbh-cardicon" }, h(BookIcon, null)),
							h("span", { className: "wbh-cardtitle" }, t("lib.title")),
							skills.status === "ready" ? h("span", { className: "wbh-badge" }, `${skills.names.length} ${t("lib.unit")}`) : null,
							h("span", { className: "wbh-spacer" }),
							h("input", {
								className: "wbh-search",
								type: "search",
								value: query,
								placeholder: t("lib.search"),
								"aria-label": t("lib.search"),
								onChange: (event) => setQuery(event.target.value)
							}),
							h("button", { type: "button", className: "wbh-ghost", onClick: () => setAttempt((n) => n + 1) }, t("action.refresh"))
						),
						h(
							"div",
							{ className: "wbh-cardbody" },
							h("p", { className: "wbh-hint" }, t("lib.hint")),
							toneNames.length > 1
								? h(
										"div",
										{ className: "wbh-filters" },
										h(
											"button",
											{ type: "button", className: `wbh-chip${tone === "" ? " is-on" : ""}`, onClick: () => setTone("") },
											t("lib.filter.all")
										),
										toneNames.map((label) =>
											h(
												"button",
												{
													key: label,
													type: "button",
													className: `wbh-chip${tone === label ? " is-on" : ""}`,
													onClick: () => setTone(tone === label ? "" : label)
												},
												h("span", { className: "wbh-chipdot", style: { background: toneOf(label) } }),
												label
											)
										)
									)
								: null,
							drift
								? h("div", { className: "wbh-notice wbh-warnmargin" }, h("span", null, h("b", null, `${skills.names.length} / ${SKILL_INDEX.skills.length}`), " · ", t("lib.drift")))
								: null,
							body,
							h(
								"p",
								{ className: "wbh-note" },
								t("lib.add"),
								SKILL_INDEX.generatedAt && SKILL_INDEX.generatedAt !== "(未生成)" ? ` · ${t("lib.generated")} ${SKILL_INDEX.generatedAt}` : ""
							)
						)
					),
					selected !== null ? h(SkillDialog, { skill: selected, t, onClose: () => setOpen("") }) : null
				)
			);
		}

		const name = PLUGIN_NAME;
		/** 必需的客户端服务：插槽注册表 + 语言字典（uiWorkspace 走迟到绑定，不进 inject）。 */
		const inject = ["slots", "locale"];

		/**
		 * 客户端插件体：注入样式与字典，注册本包自己那几处插槽。
		 * @param ctx - 客户端根上下文。
		 */
		function apply(ctx) {
			const translate = ctx.locale.bind(LOCALE_NS);

			/**
			 * 查文案：字典查不到时回落到内置中文，避免渲染裸 key。
			 * @param key - 字典 key。
			 * @returns 当前语言下的文案。
			 */
			function t(key) {
				try {
					const value = translate(key);
					if (typeof value === "string" && value.length > 0 && value !== key) return value;
				} catch (error) {
					console.error(`[${PLUGIN_NAME}] 文案查询失败：${key}`, error);
				}
				return DICT_ZH[key] ?? key;
			}

			/**
			 * 递归扫形状把会话 id 抠出来（深度 4）。
			 *
			 * 为什么不用"调方法"：实测 `sessions` 服务的 `list` 存在但**不是函数**（是数据对象），
			 * `useSessions` 返回的形状也不固定 —— 所以只能扫；扫不出时把**每一层的形状**都记下来，
			 * 让下一次失败能直接看出会话藏在哪个键里。
			 *
			 * @param roots - 可能藏会话的根对象数组。
			 * @returns `{ ids, notes }`：抠出的 id 与遍历日志。
			 */
			function harvestSessionIds(roots) {
				/**
				 * 安全读属性：Cordis 的服务代理对未声明 inject 的属性会**抛错**
				 * （实测报错 `cannot get property "sessionId" without inject`），所以每次读都要兜住。
				 * @param object - 目标对象。
				 * @param key - 属性名。
				 * @returns 读到的值；抛错或不存在时返回 undefined。
				 */
				const safeGet = (object, key) => {
					try {
						return object[key];
					} catch {
						return undefined;
					}
				};
				const strict = [];
				const loose = [];
				const seen = new Set();
				const notes = [];
				const GETTERS = ["get", "list", "all", "values", "toArray", "entries", "snapshot", "current", "active"];
				const KEYS = ["value", "snapshot", "rows", "sessions", "items", "list", "all", "entries", "current", "active", "activeId", "currentId", "currentSessionId", "activeSessionId", "manager", "scopes", "data", "rootCtx", "store", "stores", "state", "collection", "registry", "byId", "order", "last", "latest", "recent", "selected", "visible"];
				const visit = (value, depth, path) => {
					if (depth > 4 || value === null || value === undefined || value === true || value === false) return;
					if (typeof value === "string") {
						if (value.length >= 6 && /^[A-Za-z0-9_-]+$/u.test(value)) loose.push(value);
						return;
					}
					if (typeof value === "number" || typeof value === "function") return;
					let isMap = false;
					let isSet = false;
					let isArray = false;
					try {
						isMap = value instanceof Map;
						isSet = !isMap && value instanceof Set;
						isArray = !isMap && !isSet && Array.isArray(value);
					} catch {
						return;
					}
					if (isMap) {
						notes.push(`${path}=Map[${value.size}]`);
						try {
							let i = 0;
							for (const item of value.values()) {
								if (i++ > 40) break;
								visit(item, depth + 1, `${path}{map}`);
							}
						} catch {
							notes.push(`${path}=Map(读取失败)`);
						}
						return;
					}
					if (isSet) {
						notes.push(`${path}=Set[${value.size}]`);
						try {
							let i = 0;
							for (const item of value.values()) {
								if (i++ > 40) break;
								visit(item, depth + 1, `${path}{set}`);
							}
						} catch {
							notes.push(`${path}=Set(读取失败)`);
						}
						return;
					}
					if (isArray) {
						notes.push(`${path}=数组[${value.length}]`);
						value.slice(0, 40).forEach((item, index) => visit(item, depth + 1, `${path}[${index}]`));
						return;
					}
					if (typeof value !== "object") return;
					const id = safeGet(value, "sessionId") ?? safeGet(value, "session_id") ?? safeGet(value, "id") ?? safeGet(value, "key") ?? safeGet(value, "agentId") ?? safeGet(value, "session");
					if (typeof id === "string" && id.length >= 2) {
						notes.push(`${path}→有 id`);
						if (!seen.has(id)) {
							seen.add(id);
							strict.push(id);
						}
					}
					let keys = [];
					try {
						keys = Object.keys(value);
					} catch {
						keys = [];
					}
					notes.push(`${path}{${keys.slice(0, 7).join(",")}}`);
					for (const key of [...KEYS, ...keys.filter((k) => GETTERS.includes(k) && !KEYS.includes(k))]) {
						let child = safeGet(value, key);
						if (typeof child === "function") {
							// 名字像 getter 就试调一下（零参），失败就算了
							if (!GETTERS.includes(key)) continue;
							try {
								child = child.call(value);
							} catch {
								continue;
							}
						}
						if (child === undefined || child === null) continue;
						visit(child, depth + 1, `${path}.${key}`);
					}
				};
				roots.forEach((root, index) => {
					const before = strict.length;
					visit(root, 0, `来源${index}`);
					notes.push(`来源${index}→+${strict.length - before}`);
				});
				return { ids: strict.length > 0 ? strict : [...new Set(loose)].slice(0, 5), notes: notes.slice(0, 22) };
			}
			/** 收集可能藏会话的来源：props 状态 + 各服务。 */
			function sessionRoots(panelState) {
				const roots = [panelState];
				for (const serviceName of ["sessions", "uiWorkspace", "commandUi"]) {
					try {
						roots.push(ctx.get(serviceName));
					} catch {}
				}
				try {
					const workspace = ctx.get("uiWorkspace");
					if (workspace !== undefined && workspace !== null) roots.push(workspace.sessions);
				} catch {}
				return roots;
			}

			// conversation 服务（官方公开 API）：把一句话送进会话 —— 页面按钮借它触发命令。
			let conversationSend = null;
			const adoptConversation = (service) => {
				if (service !== null && service !== undefined && typeof service.send === "function") {
					conversationSend = (text) => service.send(text);
					return true;
				}
				return false;
			};
			let conversationAdopted = false;
			try {
				if (typeof ctx.get === "function") conversationAdopted = adoptConversation(ctx.get("conversation"));
			} catch {}
			if (!conversationAdopted && typeof ctx.inject === "function") {
				ctx.inject(["conversation"], (scoped) => {
					adoptConversation(scoped?.conversation);
				});
			}

			// 带 commandUi + remote 权限的**作用域**：调用时用 `scoped.commandUi.execute(...)`
			// （点属性，不是 get()；get() 会拿回绑根 fiber 的代理 —— 前两次就是这么栽的）
			// conversation / uiConversation 在根作用域可能取不到 → 同时挂带它们权限的作用域（点属性取）
			let dialogScope = null;
			if (typeof ctx.inject === "function") {
				ctx.inject(["conversation", "uiConversation"], (scoped) => {
					dialogScope = scoped;
				});
			}

			let commandScope = null;
			if (typeof ctx.inject === "function") {
				ctx.inject(["commandUi", "remote"], (scoped) => {
					commandScope = scoped;
				});
			}

			/** 安全取服务：先试根作用域的 `get()`，再试带权限作用域的**点属性**（两类坑都兜住）。 */
			function serviceOf(name) {
				try {
					const direct = ctx.get(name);
					if (direct !== undefined && direct !== null) return direct;
				} catch {}
				if (dialogScope !== null) {
					try {
						const scopedService = dialogScope[name];
						if (scopedService !== undefined && scopedService !== null) return scopedService;
					} catch {}
				}
				return undefined;
			}

			/**
			 * 点按钮时按优先级试四条路，并回报**哪条成功**（成功路径显示在卡片上）。
			 *
			 * ① 公开 API：`uiConversation.binding(会话id).ctx` → `conversation.input.for(actx)`
			 *    → `setDraft(命令)` + `submit()` —— 等于在该会话输入框里敲下这条命令并回车
			 *    （用法照抄官方：`conversation.input.for(actx).focus()`）。
			 * ② 带 `commandUi + remote` 权限作用域里的 `scoped.commandUi.execute(...)`。
			 * ③ 公开 API `conversation.send(...)`（需要会话作用域，可能被拒）。
			 * ④ 复制到剪贴板（兜底，绝不出现"点了没反应"）。
			 *
			 * @param line - 命令行，如 `/skill-menu remove ui-polish`。
			 * @param panelState - 面板拿到的会话状态（用于扫会话 id）。
			 * @returns `{ via, detail }`：via 非空即成功；否则 detail 逐条说明原因。
			 */
			async function runToggle(line, panelState) {
				const notes = [];
				const harvested = harvestSessionIds(sessionRoots(panelState));
				const ids = harvested.ids;

				// ① 会话输入框：写草稿 + 提交（**照官方配方**）
				//    官方源码（dsh-client-ui-commands）：
				//      const binding = sessions.binding(session.sessionId);
				//      binding.ctx.get("conversation").input.for(binding.ctx).focus();
				//    要点：会话作用域 ctx 来自 **sessions.binding(id).ctx**（不是 uiConversation.binding！），
				//    并且要通过它去 get("conversation")。
				const sessions = serviceOf("sessions");
				if (sessions !== undefined && sessions !== null && typeof sessions.binding === "function" && ids.length > 0) {
					for (const id of ids) {
						try {
							const binding = sessions.binding(id);
							const actx = binding === undefined || binding === null ? undefined : binding.ctx;
							if (actx === undefined) {
								notes.push(`input：${String(id).slice(0, 8)}… binding 上没有 ctx`);
								continue;
							}
							const sessionConversation = typeof actx.get === "function" ? actx.get("conversation") : undefined;
							// 硬闸：先确认该会话的命令清单里有 skill-menu —— 否则提交会被当普通文本发成消息。
							// （这就是"点按钮却冒出一条消息"的根因：命令清单按会话缓存，认不出这条命令。）
							const commandDir = serviceOf("command");
							let catalogKnown = false;
							if (commandDir !== undefined && commandDir !== null && typeof commandDir.list === "function") {
								try {
									const catalog = await commandDir.list({ sessionId: id });
									catalogKnown = JSON.stringify(catalog ?? null).includes("skill-menu");
								} catch (error) {
									notes.push(`清单查询失败：${String(error?.message ?? error).slice(0, 40)}`);
								}
							}
							if (!catalogKnown) {
								notes.push("该会话的命令清单里还没有 skill-menu —— 不提交（否则会变成一条消息）");
								continue;
							}
							const input = sessionConversation === undefined || sessionConversation === null ? undefined : sessionConversation.input?.for?.(actx);
							if (input === undefined) {
								notes.push("input：会话作用域里取不到 conversation.input");
								continue;
							}
							input.setDraft(line);
							// 关键：等草稿真的落进编辑器再提交 —— 否则命令认领可能还没完成，
							// 提交会退化成"当普通文本发出去"（实测：同一个按钮，一次执行、一次变成消息）。
							await new Promise((resolve) => setTimeout(resolve, 220));
							input.submit();
							return { via: "会话输入框", detail: "" };
						} catch (error) {
							notes.push(`input：${String(error?.message ?? error).slice(0, 60)}`);
						}
					}
				} else {
					notes.push(`input：${ids.length === 0 ? "没扫到会话" : "sessions.binding 不可用"}`);
				}

				// ② 带权限作用域里的 commandUi.execute
				if (commandScope !== null && ids.length > 0) {
					try {
						await commandScope.commandUi.execute({ sessionId: ids[0] }, line);
						return { via: "commandUi", detail: "" };
					} catch (error) {
						notes.push(`commandUi：${String(error?.message ?? error).slice(0, 60)}`);
					}
				} else {
					notes.push("commandUi：作用域或会话不可用");
				}

				// ③ 公开 API：把指令送进会话
				if (conversationSend !== null) {
					try {
						await conversationSend(line);
						return { via: "send", detail: "" };
					} catch (error) {
						notes.push(`send：${String(error?.message ?? error).slice(0, 60)}`);
					}
				} else {
					notes.push("send：不可用");
				}
				return { via: "", detail: notes.join(" ｜ ") };
			}

			// 目录服务：**迟到绑定**（apply 时它还没激活，见 AGENTS.md）。
			let directory = null;
			const waiters = new Set();
			const announce = () => {
				for (const waiter of [...waiters]) waiter();
			};
			/**
			 * 订阅"服务到达"；已就绪立即回调。返回退订函数。
			 * @param waiter - 服务就绪时的回调。
			 * @returns 退订函数。
			 */
			function subscribe(waiter) {
				if (directory !== null) {
					waiter();
					return () => {};
				}
				waiters.add(waiter);
				return () => {
					waiters.delete(waiter);
				};
			}
			/**
			 * 记下可用的目录调用并叫醒页面。
			 * @param workspace - uiWorkspace 服务面。
			 * @returns 是否装上。
			 */
			function adopt(workspace) {
				if (workspace === undefined || workspace === null || typeof workspace.listDirectory !== "function") return false;
				directory = (path, signal) => workspace.listDirectory(path, signal);
				announce();
				return true;
			}
			let adopted = false;
			try {
				if (typeof ctx.get === "function") adopted = adopt(ctx.get("uiWorkspace"));
			} catch (error) {
				console.warn(`[${PLUGIN_NAME}] 直接取 uiWorkspace 失败，继续尝试迟到绑定：`, error);
			}
			if (!adopted && typeof ctx.inject === "function") {
				ctx.inject(["uiWorkspace"], (scoped) => {
					if (!adopt(scoped?.uiWorkspace)) {
						console.warn(`[${PLUGIN_NAME}] uiWorkspace 已激活但没有 listDirectory，能力库那一段会显示提示。`);
					}
				});
			}
			const styleEl = document.createElement("style");
			styleEl.setAttribute("data-dsh-plugin", PLUGIN_NAME);
			styleEl.textContent = PAGE_CSS;
			document.head.appendChild(styleEl);
			ctx.effect(() => () => {
				styleEl.remove();
			}, `${PLUGIN_NAME}: 页面样式`);
			const disposers = [];
			try {
				disposers.push(ctx.locale.register(LOCALE_NS, "zh", DICT_ZH));
				disposers.push(ctx.locale.register(LOCALE_NS, "en", DICT_EN));
			} catch (error) {
				console.error(`[${PLUGIN_NAME}] locale 字典注册失败，改用内置中文兜底：`, error);
			}
			ctx.effect(() => () => {
				for (const dispose of disposers) dispose();
				disposers.length = 0;
				waiters.clear();
			}, `${PLUGIN_NAME}: locale 字典与订阅`);
			// ---- 页面注册（本包只有一页：能力库）----
			ctx.slots.inject(PANEL_SLOT, function* () {
				yield ctx.slots.register({ name: PANEL_SLOT, id: PANEL_KEY_LIBRARY, order: 8, label: () => t("lib.title") }, (props) =>
					h(BookIcon, { ...props, label: t("lib.title") })
				);
			});

			// 中间栏面板：key 必须与上面的 id 一致（点侧边栏入口就渲染它）。
			ctx.slots.inject(MAIN_SLOT, function* () {
				yield ctx.slots.register({ name: MAIN_SLOT, key: PANEL_KEY_LIBRARY }, (props) =>
					h(LibraryPage, { ...props, t, getDirectory: () => directory, subscribe, runToggle })
				);
			});
		}

		exports.name = name;
		exports.inject = inject;
		exports.apply = apply;
		return module.exports;
	}
});
