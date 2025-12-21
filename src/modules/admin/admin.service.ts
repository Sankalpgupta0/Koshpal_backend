import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/enums/role.enum';
import {
  CreateCompanyDto,
  UpdateCompanyStatusDto,
  UpdateCompanyLimitsDto,
  CreateHrDto,
  UpdateHrStatusDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // Company Management
  async createCompany(dto: CreateCompanyDto) {
    const company = await this.prisma.company.create({
      data: {
        name: dto.name,
        employeeLimit: dto.employeeLimit || 100,
        status: 'ACTIVE',
      },
    });
    return company;
  }

  async getCompanies() {
    return this.prisma.company.findMany({
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCompany(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async updateCompanyStatus(id: string, dto: UpdateCompanyStatusDto) {
    const company = await this.prisma.company.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: { status: dto.status as any },
    });
    return company;
  }

  async updateCompanyLimits(id: string, dto: UpdateCompanyLimitsDto) {
    const company = await this.prisma.company.update({
      where: { id },
      data: { employeeLimit: dto.employeeLimit },
    });
    return company;
  }

  // HR Management
  async createHr(dto: CreateHrDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const hr = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hashedPassword,
        role: Role.HR,
        companyId: dto.companyId,
        isActive: true,
        hrProfile: {
          create: {
            companyId: dto.companyId,
            fullName: dto.fullName as string,
            phone: (dto.phone as string | undefined) ?? undefined,
            designation: (dto.designation as string | undefined) ?? undefined,
          },
        },
      },
      include: {
        hrProfile: true,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = hr;
    return result;
  }

  async getHrs() {
    return this.prisma.user.findMany({
      where: { role: Role.HR },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        companyId: true,
        createdAt: true,
        company: {
          select: {
            name: true,
          },
        },
        hrProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getHr(id: string) {
    const hr = await this.prisma.user.findUnique({
      where: { id, role: Role.HR },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        companyId: true,
        createdAt: true,
        company: {
          select: {
            name: true,
          },
        },
        hrProfile: true,
      },
    });

    if (!hr) {
      throw new NotFoundException('HR not found');
    }

    return hr;
  }

  async updateHrStatus(id: string, dto: UpdateHrStatusDto) {
    const hr = await this.prisma.user.update({
      where: { id, role: Role.HR },
      data: { isActive: dto.status === 'ACTIVE' },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        companyId: true,
      },
    });
    return hr;
  }

  // Platform Stats
  async getStats() {
    const [totalCompanies, activeCompanies, totalHrs, totalEmployees] =
      await Promise.all([
        this.prisma.company.count(),
        this.prisma.company.count({ where: { status: 'ACTIVE' } }),
        this.prisma.user.count({ where: { role: Role.HR } }),
        this.prisma.user.count({ where: { role: Role.EMPLOYEE } }),
      ]);

    return {
      totalCompanies,
      activeCompanies,
      totalHrs,
      totalEmployees,
    };
  }
}
