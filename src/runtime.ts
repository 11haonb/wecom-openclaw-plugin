/**
 * WeCom Runtime - 存储 OpenClaw 运行时引用
 */
import type { PluginRuntime } from "openclaw/plugin-sdk";

let runtime: PluginRuntime | null = null;

export function setWeComRuntime(r: PluginRuntime): void {
  runtime = r;
}

export function getWeComRuntime(): PluginRuntime {
  if (!runtime) {
    throw new Error("[WeCom] Runtime not initialized. Plugin not registered?");
  }
  return runtime;
}

export function hasWeComRuntime(): boolean {
  return runtime !== null;
}
