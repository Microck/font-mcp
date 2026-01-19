"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FontHunterService = void 0;
var axios_1 = require("axios");
var promises_1 = require("fs/promises");
var path_1 = require("path");
var config_js_1 = require("../config.js");
var FontHunterService = /** @class */ (function () {
    function FontHunterService() {
        this.sources = [
            {
                name: 'GitHub Raw Files',
                searchUrl: 'https://raw.githubusercontent.com/search',
                directUrlPattern: 'https://raw.githubusercontent.com/username/repo/refs/heads/main/fonts'
            },
            {
                name: 'Internet Archive',
                searchUrl: 'https://archive.org/advancedsearch.php',
                directUrlPattern: 'https://archive.org/download/{name}/{name}.zip'
            },
            {
                name: 'NPM Registry (webfonts)',
                searchUrl: 'https://www.npmjs.com/search?q={name}',
                directUrlPattern: 'https://unpkg.com/{name}/fonts'
            },
            {
                name: 'CDN Fonts',
                searchUrl: 'https://cdn.jsdelivr.net/gh/search',
                directUrlPattern: 'https://cdn.jsdelivr.net/gh/{repo}/{path}'
            },
            {
                name: 'Font Squirrel',
                searchUrl: 'https://www.fontsquirrel.com/search?q={name}'
            },
            {
                name: 'Google Search Patterns',
                searchUrl: 'https://www.google.com/search?q={name}'
            }
        ];
        this.fontExtensions = ['.woff2', '.woff', '.ttf', '.otf', '.eot'];
        this.fontWeights = ['Regular', 'Bold', 'Medium', 'Light', 'Black', 'Thin', 'ExtraBold', 'SemiBold'];
        this.fontStyles = ['Italic', 'Normal'];
    }
    FontHunterService.prototype.findFontFile = function (fontName) {
        return __awaiter(this, void 0, void 0, function () {
            var config, cleanName, keywords, directMatch, searchMatch, sourceMatch, cdnMatch, archiveMatch;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = (0, config_js_1.getConfig)();
                        cleanName = fontName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
                        keywords = this.generateSearchKeywords(fontName);
                        console.error("[FontHunter] Searching for font: ".concat(fontName));
                        return [4 /*yield*/, this.tryDirectPatterns(cleanName)];
                    case 1:
                        directMatch = _a.sent();
                        if (directMatch)
                            return [2 /*return*/, directMatch];
                        return [4 /*yield*/, this.tryGoogleSearchPatterns(fontName, cleanName, keywords)];
                    case 2:
                        searchMatch = _a.sent();
                        if (searchMatch)
                            return [2 /*return*/, searchMatch];
                        return [4 /*yield*/, this.searchAllSources(fontName, cleanName, keywords)];
                    case 3:
                        sourceMatch = _a.sent();
                        if (sourceMatch)
                            return [2 /*return*/, sourceMatch];
                        return [4 /*yield*/, this.tryCdnPatterns(cleanName)];
                    case 4:
                        cdnMatch = _a.sent();
                        if (cdnMatch)
                            return [2 /*return*/, cdnMatch];
                        return [4 /*yield*/, this.tryArchivePatterns(cleanName)];
                    case 5:
                        archiveMatch = _a.sent();
                        if (archiveMatch)
                            return [2 /*return*/, archiveMatch];
                        return [2 /*return*/, null];
                }
            });
        });
    };
    FontHunterService.prototype.tryDirectPatterns = function (cleanName) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, weight, _b, _c, ext, url;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _i = 0, _a = this.fontWeights;
                        _d.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        weight = _a[_i];
                        _b = 0, _c = this.fontExtensions;
                        _d.label = 2;
                    case 2:
                        if (!(_b < _c.length)) return [3 /*break*/, 5];
                        ext = _c[_b];
                        url = this.tryDirectPattern(cleanName, weight, ext);
                        return [4 /*yield*/, this.testUrl(url)];
                    case 3:
                        if (_d.sent()) {
                            console.error("[FontHunter] Found via direct pattern: ".concat(url));
                            return [2 /*return*/, url];
                        }
                        _d.label = 4;
                    case 4:
                        _b++;
                        return [3 /*break*/, 2];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, null];
                }
            });
        });
    };
    FontHunterService.prototype.searchAllSources = function (fontName, cleanName, keywords) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, source, urls, _b, urls_1, url;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _i = 0, _a = this.sources;
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 7];
                        source = _a[_i];
                        console.error("[FontHunter] Trying source: ".concat(source.name));
                        return [4 /*yield*/, this.searchSource(source, fontName, cleanName, keywords)];
                    case 2:
                        urls = _c.sent();
                        _b = 0, urls_1 = urls;
                        _c.label = 3;
                    case 3:
                        if (!(_b < urls_1.length)) return [3 /*break*/, 6];
                        url = urls_1[_b];
                        return [4 /*yield*/, this.testUrl(url)];
                    case 4:
                        if (_c.sent()) {
                            console.error("[FontHunter] Found via ".concat(source.name, ": ").concat(url));
                            return [2 /*return*/, url];
                        }
                        _c.label = 5;
                    case 5:
                        _b++;
                        return [3 /*break*/, 3];
                    case 6:
                        _i++;
                        return [3 /*break*/, 1];
                    case 7: return [2 /*return*/, null];
                }
            });
        });
    };
    FontHunterService.prototype.tryCdnPatterns = function (cleanName) {
        return __awaiter(this, void 0, void 0, function () {
            var cdnUrls, _i, cdnUrls_1, url;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cdnUrls = this.generateCdnPatterns(cleanName);
                        _i = 0, cdnUrls_1 = cdnUrls;
                        _a.label = 1;
                    case 1:
                        if (!(_i < cdnUrls_1.length)) return [3 /*break*/, 4];
                        url = cdnUrls_1[_i];
                        return [4 /*yield*/, this.testUrl(url)];
                    case 2:
                        if (_a.sent()) {
                            console.error("[FontHunter] Found via CDN: ".concat(url));
                            return [2 /*return*/, url];
                        }
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, null];
                }
            });
        });
    };
    FontHunterService.prototype.tryArchivePatterns = function (cleanName) {
        return __awaiter(this, void 0, void 0, function () {
            var archiveUrls, _i, archiveUrls_1, url;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        archiveUrls = this.generateArchivePatterns(cleanName);
                        _i = 0, archiveUrls_1 = archiveUrls;
                        _a.label = 1;
                    case 1:
                        if (!(_i < archiveUrls_1.length)) return [3 /*break*/, 4];
                        url = archiveUrls_1[_i];
                        return [4 /*yield*/, this.testUrl(url)];
                    case 2:
                        if (_a.sent()) {
                            console.error("[FontHunter] Found via archive: ".concat(url));
                            return [2 /*return*/, url];
                        }
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, null];
                }
            });
        });
    };
    FontHunterService.prototype.tryGoogleSearchPatterns = function (fontName, cleanName, keywords) {
        return __awaiter(this, void 0, void 0, function () {
            var searchPatterns, _i, searchPatterns_1, pattern;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.error("[FontHunter] Trying Google/Browser search patterns");
                        searchPatterns = this.generateGoogleSearchPatterns(fontName, cleanName, keywords);
                        _i = 0, searchPatterns_1 = searchPatterns;
                        _a.label = 1;
                    case 1:
                        if (!(_i < searchPatterns_1.length)) return [3 /*break*/, 4];
                        pattern = searchPatterns_1[_i];
                        return [4 /*yield*/, this.testUrl(pattern.url)];
                    case 2:
                        if (_a.sent()) {
                            console.error("[FontHunter] Found via Google search pattern: ".concat(pattern.url));
                            return [2 /*return*/, pattern.url];
                        }
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, null];
                }
            });
        });
    };
    FontHunterService.prototype.generateGoogleSearchPatterns = function (fontName, cleanName, keywords) {
        var patterns = [];
        for (var _i = 0, keywords_1 = keywords; _i < keywords_1.length; _i++) {
            var keyword = keywords_1[_i];
            for (var _a = 0, _b = this.fontExtensions; _a < _b.length; _a++) {
                var ext = _b[_a];
                patterns.push({
                    url: "https://raw.githubusercontent.com/search?q=".concat(encodeURIComponent(keyword + ext)),
                    query: "site:github.com \"".concat(keyword, "\" filetype:").concat(ext.replace('.', ''))
                });
                patterns.push({
                    url: "https://gitlab.com/search?search=".concat(encodeURIComponent(keyword + ext)),
                    query: "site:gitlab.com \"".concat(keyword, "\" filetype:").concat(ext.replace('.', ''))
                });
                patterns.push({
                    url: "https://bitbucket.org/search?q=".concat(encodeURIComponent(keyword + ext)),
                    query: "site:bitbucket.org \"".concat(keyword, "\" filetype:").concat(ext.replace('.', ''))
                });
                patterns.push({
                    url: "https://raw.githubusercontent.com/".concat(keyword, "/").concat(keyword, "-").concat(ext),
                    query: "site:raw.githubusercontent.com \"".concat(keyword, "\"")
                });
                patterns.push({
                    url: "https://cdn.jsdelivr.net/gh/".concat(keyword, "/").concat(keyword, "-").concat(ext),
                    query: "site:jsdelivr.net \"".concat(keyword, "\"")
                });
            }
        }
        return __spreadArray([], new Set(patterns.map(function (p) { return p.url; })), true).map(function (url) { return ({ url: url, query: '' }); });
    };
    FontHunterService.prototype.generateSearchKeywords = function (fontName) {
        var words = fontName.split(/\s+/);
        var variants = [fontName];
        variants.push(fontName.replace(/\s+/g, ''));
        variants.push(fontName.replace(/\s+/g, '-'));
        if (words.length > 1) {
            variants.push(words.join(''));
            variants.push(words.join('-'));
        }
        return __spreadArray([], new Set(variants), true);
    };
    FontHunterService.prototype.tryDirectPattern = function (cleanName, weight, ext) {
        var patterns = [
            "https://cdn.jsdelivr.net/gh/".concat(cleanName, "/").concat(cleanName, "-").concat(weight).concat(ext),
            "https://raw.githubusercontent.com/search/".concat(cleanName, "-").concat(weight).concat(ext),
            "https://unpkg.com/".concat(cleanName, "@latest/").concat(cleanName, "-").concat(weight).concat(ext),
            "https://fonts.gstatic.com/s/".concat(cleanName, "/").concat(cleanName, "-").concat(weight).concat(ext),
        ];
        return patterns[Math.floor(Math.random() * patterns.length)];
    };
    FontHunterService.prototype.generateCdnPatterns = function (cleanName) {
        var patterns = [];
        for (var _i = 0, _a = this.fontWeights; _i < _a.length; _i++) {
            var weight = _a[_i];
            for (var _b = 0, _c = this.fontExtensions; _b < _c.length; _b++) {
                var ext = _c[_b];
                patterns.push("https://cdn.jsdelivr.net/npm/@fontsource/".concat(cleanName.toLowerCase(), "/files/").concat(cleanName.toLowerCase(), "-").concat(weight.toLowerCase()).concat(ext));
                patterns.push("https://unpkg.com/".concat(cleanName, "/").concat(weight).concat(ext));
                patterns.push("https://cdnjs.cloudflare.com/ajax/libs/".concat(cleanName, "/").concat(weight).concat(ext));
            }
        }
        return patterns;
    };
    FontHunterService.prototype.generateArchivePatterns = function (cleanName) {
        var patterns = [];
        patterns.push("https://archive.org/download/".concat(cleanName, "/").concat(cleanName, ".zip"));
        patterns.push("https://archive.org/download/".concat(cleanName.toLowerCase(), "/").concat(cleanName.toLowerCase(), ".zip"));
        patterns.push("https://gitlab.com/api/v4/projects/search?q=".concat(cleanName));
        patterns.push("https://bitbucket.org/search?q=".concat(cleanName));
        return patterns;
    };
    FontHunterService.prototype.searchSource = function (source, fontName, cleanName, keywords) {
        return __awaiter(this, void 0, void 0, function () {
            var urls, _i, keywords_2, keyword, _a, _b, ext, url;
            return __generator(this, function (_c) {
                urls = [];
                try {
                    // Generate candidate URLs based on source
                    for (_i = 0, keywords_2 = keywords; _i < keywords_2.length; _i++) {
                        keyword = keywords_2[_i];
                        for (_a = 0, _b = this.fontExtensions; _a < _b.length; _a++) {
                            ext = _b[_a];
                            if (source.directUrlPattern) {
                                url = source.directUrlPattern
                                    .replace('{name}', keyword)
                                    .replace('{repo}', keyword)
                                    .replace('{path}', "".concat(keyword, "-").concat(ext));
                                urls.push(url);
                            }
                            // Try search-based URLs
                            urls.push("".concat(source.searchUrl, "?q=").concat(encodeURIComponent(keyword + ext)));
                        }
                    }
                }
                catch (e) {
                    console.error("[FontHunter] Error searching ".concat(source.name, ":"), e);
                }
                return [2 /*return*/, urls];
            });
        });
    };
    FontHunterService.prototype.testUrl = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var config, response, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = (0, config_js_1.getConfig)();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, axios_1.default.head(url, {
                                timeout: config.downloadTimeoutMs,
                                validateStatus: function (status) { return status >= 200 && status < 400; }
                            })];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, response.status >= 200 && response.status < 400];
                    case 3:
                        e_1 = _a.sent();
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    FontHunterService.prototype.downloadFont = function (url, fontName) {
        return __awaiter(this, void 0, void 0, function () {
            var config, cleanName, outputDir, fileName, destPath, response, e_2, errorMsg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = (0, config_js_1.getConfig)();
                        cleanName = fontName.replace(/\s+/g, '-').toLowerCase();
                        outputDir = config.outputDir;
                        fileName = path_1.default.basename(url);
                        destPath = path_1.default.join(outputDir, cleanName, fileName);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        // Ensure directory exists
                        return [4 /*yield*/, promises_1.default.mkdir(path_1.default.dirname(destPath), { recursive: true })];
                    case 2:
                        // Ensure directory exists
                        _a.sent();
                        return [4 /*yield*/, axios_1.default.get(url, {
                                responseType: 'arraybuffer',
                                timeout: config.downloadTimeoutMs,
                                validateStatus: function (status) { return status >= 200 && status < 400; }
                            })];
                    case 3:
                        response = _a.sent();
                        return [4 /*yield*/, promises_1.default.writeFile(destPath, response.data)];
                    case 4:
                        _a.sent();
                        console.error("[FontHunter] Successfully downloaded ".concat(fontName, " to ").concat(destPath));
                        return [2 /*return*/, {
                                success: true,
                                filePath: destPath
                            }];
                    case 5:
                        e_2 = _a.sent();
                        errorMsg = e_2 instanceof Error ? e_2.message : String(e_2);
                        console.error("[FontHunter] Download failed for ".concat(url, ":"), errorMsg);
                        return [2 /*return*/, {
                                success: false,
                                error: errorMsg
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    FontHunterService.prototype.huntWithMultipleAttempts = function (fontName) {
        return __awaiter(this, void 0, void 0, function () {
            var config, attempt, url, result, searchQueries;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = (0, config_js_1.getConfig)();
                        console.error("[FontHunter] Starting hunt for ".concat(fontName, " with ").concat(config.maxDownloadAttempts, " attempts"));
                        attempt = 1;
                        _a.label = 1;
                    case 1:
                        if (!(attempt <= config.maxDownloadAttempts)) return [3 /*break*/, 7];
                        console.error("[FontHunter] Attempt ".concat(attempt, "/").concat(config.maxDownloadAttempts));
                        return [4 /*yield*/, this.findFontFile(fontName)];
                    case 2:
                        url = _a.sent();
                        if (!url) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.downloadFont(url, fontName)];
                    case 3:
                        result = _a.sent();
                        if (result.success) {
                            return [2 /*return*/, {
                                    success: true,
                                    filePath: result.filePath
                                }];
                        }
                        _a.label = 4;
                    case 4:
                        if (!(attempt < config.maxDownloadAttempts)) return [3 /*break*/, 6];
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 7:
                        searchQueries = this.generateLastResortQueries(fontName);
                        return [2 /*return*/, {
                                success: false,
                                lastResortInfo: this.formatLastResortMessage(fontName, searchQueries)
                            }];
                }
            });
        });
    };
    FontHunterService.prototype.generateLastResortQueries = function (fontName) {
        var cleanName = fontName.replace(/\s+/g, '');
        var keywords = this.generateSearchKeywords(fontName);
        var queries = [];
        // GitHub searches
        for (var _i = 0, keywords_3 = keywords; _i < keywords_3.length; _i++) {
            var keyword = keywords_3[_i];
            queries.push("site:github.com \"".concat(keyword, " filetype:otf\""));
            queries.push("site:github.com \"".concat(keyword, " filetype:woff2\""));
            queries.push("site:github.com \"".concat(keyword, " filetype:ttf\""));
        }
        // General web searches
        for (var _a = 0, keywords_4 = keywords; _a < keywords_4.length; _a++) {
            var keyword = keywords_4[_a];
            queries.push("\"".concat(keyword, "\" filetype:otf download"));
            queries.push("\"".concat(keyword, "\" filetype:woff2 download"));
            queries.push("\"".concat(keyword, "\" webfont download"));
            queries.push("\"".concat(keyword, "\" site:archive.org"));
        }
        return __spreadArray([], new Set(queries), true);
    };
    FontHunterService.prototype.formatLastResortMessage = function (fontName, queries) {
        var searchQueries = queries.slice(0, 10).map(function (q) { return "  - ".concat(q); }).join('\n');
        return "\n================================================================================\nFONT DOWNLOAD FAILED - LAST RESORT OPTIONS\n================================================================================\n\nCould not automatically find font files for: \"".concat(fontName, "\"\n\nTry these search queries manually:\n\n").concat(searchQueries, "\n\n================================================================================\n").trim();
    };
    return FontHunterService;
}());
exports.FontHunterService = FontHunterService;
