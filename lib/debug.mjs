/**
 * 调试日志：只在 `DSH_WORKBENCH_DEBUG=1` 时写 `/tmp/dsh-workbench-debug.log`（默认完全静默）。
 *
 * 为什么单独一个文件：本包的主机半边要记几条"为什么不生效"的线索（config 归一化结果、
 * 路径解析结果、投影是否注册成功），但不能往正式日志里刷屏，也不能因为写日志失败而影响功能。
 */
import { appendFileSync } from "node:fs";

/**
 * 写一行调试日志（失败静默）。
 * @param line - 日志正文。
 * @returns 无。
 */
export function debug(line) {
	if (process.env.DSH_WORKBENCH_DEBUG !== "1") return;
	try {
		appendFileSync("/tmp/dsh-workbench-debug.log", `${new Date().toISOString()} ${line}\n`);
	} catch { /* 日志失败不影响功能 */ }
}
