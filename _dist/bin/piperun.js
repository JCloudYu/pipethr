#!/usr/bin/env node
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var clipargs_1 = __importDefault(require("clipargs"));
var promises_1 = __importDefault(require("fs/promises"));
var path_1 = __importDefault(require("path"));
var args = clipargs_1.default
    .flag('help', '--help')
    .flag('silent', '-s', '--silent')
    .flag('daily', '-D', '--daily')
    .flag('monthly', '-M', '--monthly')
    .flag('yearly', '-Y', '--yearly')
    .parse(process.argv.slice(2));
if (args._.length <= 0) {
    console.error("Please provides LOG_PATH!");
    args.help = true;
}
if (args.help) {
    console.error("Usage: pipethr [--daily] [--monthly] [--yearly] [--silent] LOG_PATH");
    process.exit(0);
}
var PERIOD_IDS = ['yearly', 'monthly', 'daily'];
var Runtime = {
    silent: args.silent || false,
    base_path: args._[0],
    time_id: '',
    period: 'daily',
    data_pool: [],
    log_timeout: null
};
process.stdin
    .on('data', function (c) { return Runtime.data_pool.push(c); })
    .on('end', function () { return Runtime.log_timeout = 0; });
process
    .on('SIGHUP', function () { }).on('SIGHUP', function () { }).on('SIGINT', function () { })
    .on('SIGQUIT', SignalTerminate)
    .on('SIGHUP', SignalTerminate)
    .on('SIGTERM', SignalTerminate);
Runtime.log_timeout = setTimeout(ProcessLog, 0);
function ProcessLog() {
    var _this = this;
    Promise.resolve().then(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(Runtime.data_pool.length > 0)) return [3 /*break*/, 2];
                    return [4 /*yield*/, ConsumeLog()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 0];
                case 2: return [2 /*return*/];
            }
        });
    }); })
        .then(function () {
        if (Runtime.log_timeout === false) {
            setTimeout(function () { return process.exit(1); });
            return;
        }
        if (Runtime.log_timeout === 0) {
            setTimeout(function () { return process.exit(0); });
            return;
        }
        Runtime.log_timeout = setTimeout(ProcessLog, 0);
    })
        .catch(function (e) {
        console.error("Cannot write log due to unexpected error!", e);
        setTimeout(function () { return process.exit(1); });
    });
}
function ConsumeLog() {
    return __awaiter(this, void 0, void 0, function () {
        var now, time, time_id, data, log_path;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    now = new Date();
                    time = {
                        year: "".concat(now.getFullYear()),
                        month: "".concat(now.getMonth() + 1).padStart(2, '0'),
                        day: "".concat(now.getDate()).padStart(2, '0')
                    };
                    time_id = '';
                    switch (Runtime.period) {
                        case 'monthly':
                            time_id = "".concat(time.year).concat(time.month);
                            break;
                        case 'yearly':
                            time_id = "".concat(time.year);
                            break;
                        case 'daily':
                        default:
                            time_id = "".concat(time.year).concat(time.month).concat(time.day);
                            break;
                    }
                    data = Buffer.concat(Runtime.data_pool.splice(0, 100));
                    log_path = Runtime.base_path.replace('{}', time_id);
                    if (!(Runtime.time_id !== time_id)) return [3 /*break*/, 2];
                    return [4 /*yield*/, promises_1.default.mkdir(path_1.default.dirname(log_path), { recursive: true }).catch(function (e) {
                            if (e.code !== 'EEXIST')
                                throw e;
                        })];
                case 1:
                    _a.sent();
                    Runtime.time_id = time_id;
                    _a.label = 2;
                case 2: return [4 /*yield*/, promises_1.default.appendFile(log_path, data)];
                case 3:
                    _a.sent();
                    if (!Runtime.silent) {
                        process.stdout.write(data);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function SignalTerminate() {
    Runtime.log_timeout = false;
}
