// Configs 左栏(文件树)可拖动宽度的纯逻辑:常量 + 校验/clamp + 持久化读取。
// 抽成无 React/无副作用的叶子模块,便于单测;Configs.tsx 引用这些符号。
export const RAIL_WIDTH_KEY = 'b300.configs.rail_width'
export const RAIL_WIDTH_MIN = 160      // 比当前 224 略窄,允许收窄
export const RAIL_WIDTH_MAX = 520      // 富余上限(实测最长文件名 23 字符,~255px 即够)
export const RAIL_WIDTH_DEFAULT = 224  // = 原 w-56,默认观感不变

/** 把任意宽度收敛到 [MIN, MAX]。拖拽过程实时调用。 */
export function clampRailWidth(w: number): number {
  return Math.max(RAIL_WIDTH_MIN, Math.min(RAIL_WIDTH_MAX, w))
}

/** 从 localStorage 读上次宽度;非数字/越界/读失败一律回落默认值(不 clamp,坏值即作废)。 */
export function loadRailWidth(): number {
  try {
    const v = Number(localStorage.getItem(RAIL_WIDTH_KEY))
    return Number.isFinite(v) && v >= RAIL_WIDTH_MIN && v <= RAIL_WIDTH_MAX ? v : RAIL_WIDTH_DEFAULT
  } catch {
    return RAIL_WIDTH_DEFAULT
  }
}
