"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsultationModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const consultation_controller_1 = require("./consultation.controller");
const consultation_service_1 = require("./consultation.service");
const meeting_service_1 = require("./meeting.service");
const prisma_module_1 = require("../../../prisma/prisma.module");
let ConsultationModule = class ConsultationModule {
};
exports.ConsultationModule = ConsultationModule;
exports.ConsultationModule = ConsultationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            bullmq_1.BullModule.registerQueue({
                name: 'consultation-email',
            }),
        ],
        controllers: [consultation_controller_1.ConsultationController],
        providers: [consultation_service_1.ConsultationService, meeting_service_1.MeetingService],
        exports: [consultation_service_1.ConsultationService],
    })
], ConsultationModule);
//# sourceMappingURL=consultation.module.js.map