"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateHrStatusDto = exports.CreateHrDto = exports.UpdateCompanyLimitsDto = exports.UpdateCompanyStatusDto = exports.CreateCompanyDto = void 0;
const class_validator_1 = require("class-validator");
class CreateCompanyDto {
    name;
    employeeLimit;
}
exports.CreateCompanyDto = CreateCompanyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateCompanyDto.prototype, "employeeLimit", void 0);
class UpdateCompanyStatusDto {
    status;
}
exports.UpdateCompanyStatusDto = UpdateCompanyStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(['ACTIVE', 'INACTIVE']),
    __metadata("design:type", String)
], UpdateCompanyStatusDto.prototype, "status", void 0);
class UpdateCompanyLimitsDto {
    employeeLimit;
}
exports.UpdateCompanyLimitsDto = UpdateCompanyLimitsDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateCompanyLimitsDto.prototype, "employeeLimit", void 0);
class CreateHrDto {
    email;
    password;
    companyId;
    fullName;
    phone;
    designation;
}
exports.CreateHrDto = CreateHrDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateHrDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], CreateHrDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateHrDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateHrDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateHrDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateHrDto.prototype, "designation", void 0);
class UpdateHrStatusDto {
    status;
}
exports.UpdateHrStatusDto = UpdateHrStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(['ACTIVE', 'INACTIVE']),
    __metadata("design:type", String)
], UpdateHrStatusDto.prototype, "status", void 0);
//# sourceMappingURL=admin.dto.js.map