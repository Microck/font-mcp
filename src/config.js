"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = void 0;
exports.setConfig = setConfig;
exports.getConfig = getConfig;
exports.DEFAULT_CONFIG = {
    maxDownloadAttempts: 10,
    downloadTimeoutMs: 30000,
    outputDir: './public/fonts'
};
// Try to load config from mcp config file if it exists
var userConfig = null;
function setConfig(config) {
    userConfig = __assign(__assign({}, userConfig), config);
}
function getConfig() {
    return __assign(__assign({}, exports.DEFAULT_CONFIG), userConfig);
}
