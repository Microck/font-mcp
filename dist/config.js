export const DEFAULT_CONFIG = {
    maxDownloadAttempts: 10,
    downloadTimeoutMs: 30000,
    outputDir: './public/fonts'
};
// Try to load config from mcp config file if it exists
let userConfig = null;
export function setConfig(config) {
    userConfig = { ...userConfig, ...config };
}
export function getConfig() {
    return { ...DEFAULT_CONFIG, ...userConfig };
}
