export const DEFAULT_CONFIG = {
    maxDownloadAttempts: 10,
    downloadTimeoutMs: 30000,
    outputDir: './public/fonts',
    allowFreeFontsFallback: false
};
// Try to load config from mcp config file if it exists
let userConfig = null;
/**
 * Override the default configuration with user-supplied values.
 * @param config - Partial configuration object. Keys not provided retain defaults.
 */
export function setConfig(config) {
    userConfig = { ...userConfig, ...config };
}
/**
 * Returns the active configuration, merging defaults with any user overrides.
 * @returns The resolved FontMcpConfig to use at runtime.
 */
export function getConfig() {
    return { ...DEFAULT_CONFIG, ...userConfig };
}
