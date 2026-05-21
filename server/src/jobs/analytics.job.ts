import prisma from '../lib/prisma';
import { logger } from '../lib/logger';

export const runAnalyticsSnapshot = async () => {
  try {
    logger.info('Running Daily Analytics Snapshot Job...');

    const activeUsers = await prisma.user.count();
    const postsCreated = await prisma.post.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    const messagesSent = await prisma.message.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
    });

    await prisma.analyticsSnapshot.create({
      data: {
        date: new Date(),
        activeUsers,
        postsCreated,
        messagesSent,
        newUsers: 0,
        totalRevenue: 0
      }
    });

    logger.info('Analytics Snapshot Job Completed Successfully.');
  } catch (error) {
    logger.error('Failed to run Analytics Snapshot Job', error);
  }
};
