let runtime = null;
export function setWeComRuntime(r) {
    runtime = r;
}
export function getWeComRuntime() {
    if (!runtime) {
        throw new Error("[WeCom] Runtime not initialized. Plugin not registered?");
    }
    return runtime;
}
export function hasWeComRuntime() {
    return runtime !== null;
}
