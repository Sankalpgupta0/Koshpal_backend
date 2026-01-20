import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { deleteFromCloudinary } from '../../common/config/cloudinary.helper'


/**
 * Employee Service
 *
 * Handles employee-specific business logic including profile management
 */
@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get comprehensive employee profile with all related data
   *
   * Returns complete employee information including:
   * - Basic user data (email, role, status)
   * - Full employee profile (demographics, contact info)
   * - Company information
   * - Account summary statistics
   * - Goal progress summary
   * - Consultation history summary
   *
   * @param userId - User UUID
   * @returns Complete employee profile with aggregated data
   * @throws NotFoundException if employee profile doesn't exist
   */
  async getFullProfile(userId: string) {
    // Fetch user with all related profile data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            domain: true,
            status: true,
          },
        },
        employeeProfile: {
          select: {
            userId: true,
            companyId: true,
            employeeCode: true,
            fullName: true,
            phone: true,
            department: true,
            dateOfJoining: true,
            profilePhoto: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.employeeProfile) {
      throw new NotFoundException('Employee profile not found');
    }

    // Fetch account statistics
    const accountStats = await this.prisma.account.groupBy({
      by: ['userId'],
      where: { userId },
      _count: true,
    });

    const totalBalance = await this.prisma.$queryRaw<
      Array<{ total: number }>
    >`SELECT COALESCE(SUM(balance), 0)::float as total FROM "Account" WHERE "userId" = ${userId}`;

    // Fetch goal statistics
    const goalStats = await this.prisma.financialGoal.aggregate({
      where: { userId },
      _count: true,
      _sum: {
        goalAmount: true,
        saving: true,
      },
    });

    const activeGoals = await this.prisma.financialGoal.count({
      where: {
        userId,
      },
    });

    const completedGoals = await this.prisma.financialGoal.count({
      where: {
        userId,
      },
    });

    // Fetch consultation statistics
    const consultationStats = await this.prisma.consultationBooking.aggregate({
      where: { employeeId: userId },
      _count: true,
    });

    const upcomingConsultations = await this.prisma.consultationBooking.count({
      where: {
        employeeId: userId,
        status: 'CONFIRMED',
        slot: {
          startTime: {
            gte: new Date(),
          },
        },
      },
    });

    const completedConsultations = await this.prisma.consultationBooking.count({
      where: {
        employeeId: userId,
        slot: {
          startTime: {
            lt: new Date(),
          },
        },
      },
    });

    

    // Return comprehensive profile
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
      company: user.company,
      profile: user.employeeProfile,
      statistics: {
        accounts: {
          total: accountStats.length > 0 ? accountStats[0]._count : 0,
          totalBalance: totalBalance[0]?.total || 0,
        },
        goals: {
          total: goalStats._count || 0,
          active: activeGoals,
          completed: completedGoals,
          totalTarget: Number(goalStats._sum.goalAmount) || 0,
          totalSaved: Number(goalStats._sum.saving) || 0,
          progress:
            goalStats._sum.goalAmount && Number(goalStats._sum.goalAmount) > 0
              ? Math.round(
                  ((Number(goalStats._sum.saving) || 0) /
                    Number(goalStats._sum.goalAmount)) *
                    100,
                )
              : 0,
        },
        consultations: {
          total: consultationStats._count || 0,
          upcoming: upcomingConsultations,
          completed: completedConsultations,
        },
      },
    };

    
  }
  // ===============================
  // UPDATE OWN PROFILE (NAME + PHONE + IMAGE)
  // ===============================

  async updateOwnProfile(
  userId: string,
  body: { name?: string; phone?: string },
  imageUrl?: string,
  imagePublicId?: string,
) {
  try {
    console.log('=== SERVICE: updateOwnProfile START ===');
    console.log('Input Parameters:', { 
      userId, 
      body, 
      hasImageUrl: !!imageUrl, 
      imageUrl: imageUrl || 'None',
      hasImagePublicId: !!imagePublicId,
      imagePublicId: imagePublicId || 'None'
    });
    
    // 1️⃣ Get existing profile
    const profile = await this.prisma.employeeProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      console.error('Employee profile not found for userId:', userId);
      throw new Error('Employee profile not found');
    }

    console.log('Existing Profile:', {
      userId: profile.userId,
      fullName: profile.fullName,
      phone: profile.phone,
      hasCurrentPhoto: !!profile.profilePhoto,
      currentPhotoUrl: profile.profilePhoto || 'None',
      currentPhotoId: profile.profilePhotoId || 'None'
    });

    // 2️⃣ Delete old image if new image uploaded
    if (imagePublicId && profile.profilePhotoId) {
      try {
        console.log('Attempting to delete old Cloudinary image:', profile.profilePhotoId);
        await deleteFromCloudinary(profile.profilePhotoId);
        console.log('Old image deleted successfully');
      } catch (error) {
        console.error('Failed to delete old image from Cloudinary:', error);
        // Continue with update even if deletion fails
      }
    } else {
      console.log('No old image to delete or no new image provided');
    }

    // 3️⃣ Prepare update data
    const updateData: any = {};
    
    if (body.name !== undefined) {
      updateData.fullName = body.name;
      console.log('Updating fullName to:', body.name);
    }
    
    if (body.phone !== undefined) {
      updateData.phone = body.phone;
      console.log('Updating phone to:', body.phone);
    }
    
    if (imageUrl && imagePublicId) {
      updateData.profilePhoto = imageUrl;
      updateData.profilePhotoId = imagePublicId;
      console.log('Updating profile photo:', { imageUrl, imagePublicId });
    }

    console.log('Final update data:', updateData);

    // 4️⃣ Update profile
    const updatedProfile = await this.prisma.employeeProfile.update({
      where: { userId },
      data: updateData,
    });

    console.log('Profile updated successfully in database:', {
      userId: updatedProfile.userId,
      fullName: updatedProfile.fullName,
      phone: updatedProfile.phone,
      profilePhoto: updatedProfile.profilePhoto || 'None',
      profilePhotoId: updatedProfile.profilePhotoId || 'None'
    });
    console.log('=== SERVICE: updateOwnProfile END ===');

    return {
      message: 'Profile updated successfully',
      profile: updatedProfile,
    };
  } catch (error) {
    console.error('=== SERVICE ERROR in updateOwnProfile ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=== SERVICE ERROR END ===');
    throw error;
  }
}




  async getMyProfile(userId: string) {
  const profile = await this.prisma.employeeProfile.findUnique({
    where: { userId },
    select: {
      fullName: true,
      phone: true,
      department: true,
      profilePhoto: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  if (!profile) {
    throw new NotFoundException('Profile not found');
  }

  return {
    name: profile.fullName,
    email: profile.user.email,
    phone: profile.phone,
    profilePhoto: profile.profilePhoto,
    department: profile.department,
  };
}

  
}


