/**
 * dsh-skill-library —— 主机入口。
 *
 * 本包只做一件事：把解析好的**技能目录路径**通过官方的 `webserver/index-inject`
 * 注入成页面全局量 `__DSH_WORKBENCH_LIBRARY__`，给客户端那半边的「能力库」页用。
 *
 * 为什么要这一层（实测结论，别改成"客户端读 ctx.config"）：
 *   浏览器侧的 ClientModuleLoader 建条目时只传 `{ name: id }`
 *   （`@deepseek-ai/dsh-client-modules/lib/client.js` 的 `create()`），row config **到不了客户端**；
 *   官方 `dsh-client-shortcuts` 就是这么把配置送进页面的（同一个 `webserver/index-inject` 事件）。
 *
 * **不再有页面开关**：本包只有「能力库」这一页，客户端那半边只注册这一页的插槽
 * （见 lib/client.js 的 apply）。所以四个单页包同时装也不会互相覆盖 —— 各自写各自的全局量。
 *
 * 入口形状照官方插件抄：`export function apply(ctx, config)` + 可选的 `export const Config`。
 */
import { resolveWorkbenchPaths } from "./workbench-paths.mjs";
import { loadSchemastery } from "./official.mjs";
import { debug } from "./debug.mjs";

/** 插件名（cordis 的行名 / 日志前缀）。 */
export const name = "skill-library";

/** 注入给页面的全局量名（客户端 bundle 读它；**本包专用**，不与其它三个包共用）。 */
export const CLIENT_CONFIG_GLOBAL = "__DSH_WORKBENCH_LIBRARY__";

/**
 * 组 config schema。schemastery 拿不到时返回 undefined —— Loader 就不做校验。
 * @returns schemastery `z.object(...)`，或 undefined。
 */
function buildConfig() {
	try {
		const z = loadSchemastery();
		return z.object({
			dshHome: z.string().default("")
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
 * @returns `{ dshHome }`。
 */
export function normalizeConfig(config) {
	const raw = config !== null && typeof config === "object" ? config : {};
	return { dshHome: typeof raw.dshHome === "string" ? raw.dshHome : "" };
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
			value: { version: 2, skillsDir: paths.skillsDir }
		});
	});

	ctx.logger?.info?.(`[${name}] 已就绪：能力库页（技能目录 ${paths.skillsDir}）`);
}
