import { Router } from 'express';
import { prisma } from '@vendor-management/db';
import { z } from 'zod';
import { requireAuth } from '../middleware/require-auth.js';
import { BadRequestError, ConflictError, NotFoundError } from '../lib/errors.js';
import { notificationProvider } from '../providers/index.js';
import { trackServer } from '../lib/analytics.js';

export const mobileRouter = Router();

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const OTP_EXPIRY_MS = OTP_EXPIRY_MINUTES * 60 * 1000;

/** Generate a 6-digit OTP. */
function generateOtp(): string {
  return Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(OTP_LENGTH, '0');
}

const verifyOtpSchema = z.object({
  code: z.string().length(OTP_LENGTH),
});

/**
 * Check if mobile verification is available for the authenticated user.
 *
 * Verification is available when the user's vendor link is ONBOARDED.
 */
mobileRouter.get(
  '/',
  requireAuth,
  async (request, response, next) => {
    try {
      const user = (request as any).user;

      if (!user || user.role !== 'VENDOR') {
        throw new BadRequestError('Only vendors can verify mobile');
      }

      const link = await prisma.vendorBuyerLink.findFirst({
        where: {
          vendorUserId: user.userId,
          state: { in: ['ONBOARDED'] },
        },
      });

      response.json({
        success: true,
        data: {
          isOpen: !!link,
          linkId: link?.id ?? null,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Start mobile verification by sending a 6-digit OTP.
 *
 * Stores the OTP on the User record with a 10-minute expiry. In demo mode,
 * returns the OTP in the response.
 */
mobileRouter.post(
  '/start',
  requireAuth,
  async (request, response, next) => {
    try {
      const user = (request as any).user;

      if (!user || user.role !== 'VENDOR') {
        throw new BadRequestError('Only vendors can verify mobile');
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { id: true, name: true, email: true, mobileNumber: true },
      });

      if (!dbUser) {
        throw new NotFoundError('User not found');
      }

      if (!dbUser.mobileNumber) {
        throw new ConflictError('Mobile number not set on user profile');
      }

      // Check that user's link is ONBOARDED
      const link = await prisma.vendorBuyerLink.findFirst({
        where: {
          vendorUserId: user.userId,
          state: 'ONBOARDED',
        },
      });

      if (!link) {
        throw new ConflictError(
          'Mobile verification only available for onboarded vendors',
        );
      }

      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          mobileOtp: otp,
          mobileOtpExpiresAt: expiresAt,
        },
      });

      // Send OTP via notification provider
      await notificationProvider.send('SMS', {
        to: dbUser.mobileNumber,
        subject: 'Mobile Verification OTP',
        body: `Your OTP is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
      });

      trackServer('mobile_otp_requested', {
        distinct_id: user.userId,
        user_id: user.userId,
      });

      // Return OTP in demo mode
      response.status(201).json({
        success: true,
        data: {
          otp,
          expiresAt: expiresAt.toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Verify the OTP code.
 *
 * Validates the code against the stored OTP and expiry. Updates user's
 * mobileVerifiedAt timestamp and sets vendor badge to VERIFIED.
 */
mobileRouter.post(
  '/verify',
  requireAuth,
  async (request, response, next) => {
    try {
      const user = (request as any).user;
      const input = verifyOtpSchema.parse(request.body);

      if (!user || user.role !== 'VENDOR') {
        throw new BadRequestError('Only vendors can verify mobile');
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          id: true,
          mobileOtp: true,
          mobileOtpExpiresAt: true,
        },
      });

      if (!dbUser) {
        throw new NotFoundError('User not found');
      }

      if (!dbUser.mobileOtp || !dbUser.mobileOtpExpiresAt) {
        throw new ConflictError('No OTP requested. Start verification first.');
      }

      if (Date.now() > dbUser.mobileOtpExpiresAt.getTime()) {
        throw new ConflictError('OTP has expired. Request a new one.');
      }

      if (input.code !== dbUser.mobileOtp) {
        throw new BadRequestError('Invalid OTP code');
      }

      // Get the vendor's link to update directory vendor
      const link = await prisma.vendorBuyerLink.findFirst({
        where: {
          vendorUserId: user.userId,
          state: 'ONBOARDED',
        },
        include: { candidate: true },
      });

      if (!link) {
        throw new ConflictError(
          'Mobile verification only available for onboarded vendors',
        );
      }

      // Update user and vendor in transaction
      await prisma.$transaction(async (tx) => {
        await (tx as any).user.update({
          where: { id: dbUser.id },
          data: {
            mobileVerifiedAt: new Date(),
            mobileOtp: null,
            mobileOtpExpiresAt: null,
          },
        });

        await (tx as any).directoryVendor.update({
          where: { id: link.candidate.vendorId },
          data: { badgeState: 'VERIFIED' },
        });
      });

      trackServer('mobile_verified', {
        distinct_id: user.userId,
        user_id: user.userId,
      });

      response.json({
        success: true,
        data: {
          mobileVerifiedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);
