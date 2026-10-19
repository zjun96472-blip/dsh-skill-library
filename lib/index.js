/**
 * dsh-skill-library —— 主机入口。
 *
 * 本包**没有主机侧功能**，只做一件事：把页面开关 `pages.*` 通过官方的
 * `webserver/index-inject` 注入成页面全局量 `__DSH_WORKBENCH__`。
 *
 * 为什么要这一层（实测结论，别改成"客户端读 ctx.config"）：
 *   浏览器侧的 ClientModuleLoader 建条目时只传 `{ name: id }`
 *   （`@deepseek-ai/dsh-client-modules/lib/client.js` 的 `create()`），row config **到不了客户端**；
 *   官方 `dsh-client-shortcuts` 就是这么把配置送进页面的（同一个 `webserver/index-inject` 事件）。
 *
 * 页面开关用的是**新键 `skillLibrary`**（不是合集包里那个"能力库只是工作台页里的一个板块"的旧形状）：
 *   · `skillLibrary: true` → 侧边栏多一个「能力库」入口，中间栏渲染**只有技能卡片墙**的那一页；
 *   · `home / memory / audition / planBook` 全部显式 false → 本包不占那三页的任何插槽。
 *
 * 入口形状照官方插件抄：`export function apply(ctx, config)` + 可选的 `export const Config`。
 */
import { resolveWorkbenchPaths } from "./workbench-paths.mjs";
import { loadSchemastery } from "./official.mjs";
import { debug } from "./debug.mjs";

/** 插件名（cordis 的行名 / 日志前缀）。 */
export const name = "skill-library";

/** 注入给页面的全局量名（客户端 bundle 读它）。 */
export const CLIENT_CONFIG_GLOBAL = "__DSH_WORKBENCH__";

/** 页面开关的默认值：**只开本包这一页**（其余显式 false）。 */
const DEFAULT_PAGES = { home: false, memory: false, audition: false, planBook: false, skillLibrary: true };

/**
 * 组 config schema。schemastery 拿不到时返回 undefined —— Loader 就不做校验。
 * @returns schemastery `z.object(...)`，或 undefined。
 */
function buildConfig() {
	try {
		const z = loadSchemastery();
		return z.object({
			dshHome: z.string().default(""),
			pages: z.object({
				home: z.boolean().default(false),
				memory: z.boolean().default(false),
				audition: z.boolean().default(false),
				planBook: z.boolean().default(false),
				skillLibrary: z.boolean().default(true)
			})
		});
	} catch (error) {
		debug(`schemastery 不可用（Config 留空）：${String(error?.message ?? error).slice(0, 160)}`);
		return undefined;
	}
}

/** Loader 在激活本行前按它校验 row config。 */
export const Config = buildConfig();

/**
 * 把 config 归一化成内部形状。
 * @param config - row config（可能 undefined / 缺字段）。
 * @returns `{ dshHome, pages }`。
 */
export function normalizeConfig(config) {
	const raw = config !== null && typeof config === "object" ? config : {};
	const pages = raw.pages !== null && typeof raw.pages === "object" ? raw.pages : {};
	const page = (key) => (typeof pages[key] === "boolean" ? pages[key] : DEFAULT_PAGES[key]);
	return {
		dshHome: typeof raw.dshHome === "string" ? raw.dshHome : "",
		pages: {
			home: page("home"),
			memory: page("memory"),
			audition: page("audition"),
			planBook: page("planBook"),
			skillLibrary: page("skillLibrary")
		}
	};
}

/**
 * 主机插件体。
 * @param ctx - 主机侧上下文。
 * @param config - 本行的 config。
 * @returns 无。
 */
export function apply(ctx, config) {
	const settings = normalizeConfig(config);
	const paths = resolveWorkbenchPaths(settings.dshHome, ctx.logger);
	debug(`[${name}] apply：config=${JSON.stringify(settings)} paths=${JSON.stringify(paths)}`);

	ctx.on("webserver/index-inject", (table) => {
		table.push({
			kind: "global",
			name: CLIENT_CONFIG_GLOBAL,
			value: {
				version: 1,
				skillsDir: paths.skillsDir,
				memoryDir: paths.memoryDir,
				pages: settings.pages
			}
		});
	});

	ctx.logger?.info?.(`[${name}] 已就绪：页面开关 ${JSON.stringify(settings.pages)}`);
}
