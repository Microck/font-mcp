export interface FontMcpConfig {
  maxDownloadAttempts: number;
  downloadTimeoutMs: number;
  outputDir: string;
  allowFreeFontsFallback: boolean;
}

export const DEFAULT_CONFIG: FontMcpConfig = {
  maxDownloadAttempts: 10,
  downloadTimeoutMs: 30000,
  outputDir: './public/fonts',
  allowFreeFontsFallback: false
};

// Try to load config from mcp config file if it exists
let userConfig: Partial<FontMcpConfig> | null = null;

export function setConfig(config: Partial<FontMcpConfig>) {
  userConfig = { ...userConfig, ...config };
}

export function getConfig(): FontMcpConfig {
  return { ...DEFAULT_CONFIG, ...userConfig };
}
