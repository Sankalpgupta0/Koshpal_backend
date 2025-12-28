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
            fullName: dto.fullName,
            phone: dto.phone ?? undefined,
            designation: dto.designation ?? undefined,
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

  // Coach Management
  /**
   * Get all coaches with profile and statistics
   */
  async getCoaches() {
    const coaches = await this.prisma.user.findMany({
      where: { role: Role.COACH },
      select: {
        id: true,
        email: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        coachProfile: {
          select: {
            fullName: true,
            expertise: true,
            bio: true,
            rating: true,
            successRate: true,
            clientsHelped: true,
            location: true,
            languages: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get additional statistics for each coach
    const coachesWithStats = await Promise.all(
      coaches.map(async (coach) => {
        const [totalSlots, totalConsultations, upcomingConsultations] =
          await Promise.all([
            this.prisma.coachSlot.count({
              where: { coachId: coach.id },
            }),
            this.prisma.consultationBooking.count({
              where: {
                slot: {
                  coachId: coach.id,
                },
              },
            }),
            this.prisma.consultationBooking.count({
              where: {
                slot: {
                  coachId: coach.id,
                  startTime: {
                    gte: new Date(),
                  },
                },
                status: 'CONFIRMED',
              },
            }),
          ]);

        return {
          ...coach,
          statistics: {
            totalSlots,
            totalConsultations,
            upcomingConsultations,
          },
        };
      }),
    );

    return coachesWithStats;
  }

  /**
   * Get single coach with detailed information
   */
  async getCoach(id: string) {
    const coach = await this.prisma.user.findUnique({
      where: { id, role: Role.COACH },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        coachProfile: true,
      },
    });

    if (!coach) {
      throw new NotFoundException('Coach not found');
    }

    // Get statistics
    const [totalSlots, totalConsultations, upcomingConsultations] =
      await Promise.all([
        this.prisma.coachSlot.count({
          where: { coachId: coach.id },
        }),
        this.prisma.consultationBooking.count({
          where: {
            slot: {
              coachId: coach.id,
            },
          },
        }),
        this.prisma.consultationBooking.count({
          where: {
            slot: {
              coachId: coach.id,
              startTime: {
                gte: new Date(),
              },
            },
            status: 'CONFIRMED',
          },
        }),
      ]);

    return {
      ...coach,
      statistics: {
        totalSlots,
        totalConsultations,
        upcomingConsultations,
      },
    };
  }

  /**
   * Deactivate a coach account
   * CRITICAL: Prevents coach from accessing system
   */
  async deactivateCoach(id: string, reason?: string) {
    const coach = await this.prisma.user.findUnique({
      where: { id, role: Role.COACH },
      select: {
        id: true,
        isActive: true,
        coachProfile: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!coach) {
      throw new NotFoundException('Coach not found');
    }

    if (!coach.isActive) {
      throw new BadRequestException('Coach is already inactive');
    }

    // Deactivate the coach
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        coachProfile: true,
      },
    });

    console.log(
      `[ADMIN] Coach deactivated: ${coach.coachProfile?.fullName} (${id})${reason ? ` - Reason: ${reason}` : ''}`,
    );

    return {
      ...updated,
      message: 'Coach deactivated successfully',
      reason,
    };
  }

  /**
   * Reactivate a coach account
   */
  async reactivateCoach(id: string) {
    const coach = await this.prisma.user.findUnique({
      where: { id, role: Role.COACH },
      select: {
        id: true,
        isActive: true,
        coachProfile: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!coach) {
      throw new NotFoundException('Coach not found');
    }

    if (coach.isActive) {
      throw new BadRequestException('Coach is already active');
    }

    // Reactivate the coach
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        coachProfile: true,
      },
    });

    console.log(
      `[ADMIN] Coach reactivated: ${coach.coachProfile?.fullName} (${id})`,
    );

    return {
      ...updated,
      message: 'Coach reactivated successfully',
    };
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
