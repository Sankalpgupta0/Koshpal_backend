"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = void 0;
const common_1 = require("@nestjs/common");
let LoggerService = class LoggerService {
    context;
    setContext(context) {
        this.context = context;
    }
    log(message, context) {
        const ctx = context || this.context || 'Application';
        console.log(`[${new Date().toISOString()}] [${ctx}] INFO: ${message}`);
    }
    error(message, trace, context) {
        const ctx = context || this.context || 'Application';
        console.error(`[${new Date().toISOString()}] [${ctx}] ERROR: ${message}`);
        if (trace) {
            console.error(`[${new Date().toISOString()}] [${ctx}] TRACE: ${trace}`);
        }
    }
    warn(message, context) {
        const ctx = context || this.context || 'Application';
        console.warn(`[${new Date().toISOString()}] [${ctx}] WARN: ${message}`);
    }
    debug(message, context) {
        if (process.env.NODE_ENV === 'development') {
            const ctx = context || this.context || 'Application';
            console.debug(`[${new Date().toISOString()}] [${ctx}] DEBUG: ${message}`);
        }
    }
    verbose(message, context) {
        if (process.env.NODE_ENV === 'development') {
            const ctx = context || this.context || 'Application';
            console.log(`[${new Date().toISOString()}] [${ctx}] VERBOSE: ${message}`);
        }
    }
};
exports.LoggerService = LoggerService;
exports.LoggerService = LoggerService = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.TRANSIENT })
], LoggerService);
//# sourceMappingURL=logger.service.js.map