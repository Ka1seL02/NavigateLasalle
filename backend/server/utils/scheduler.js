import cron from 'node-cron';
import Post from '../models/Post.js';

const startScheduler = () => {
    // Runs every minute
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();

            const postsToPublish = await Post.find({
                status: 'Scheduled',
                scheduledAt: { $lte: now }
            });

            if (postsToPublish.length > 0) {
                for (const post of postsToPublish) {
                    post.status = 'Published';
                    post.publishedAt = now;
                    post.scheduledAt = null;
                    await post.save();
                    console.log(`Auto-published post: ${post.title}`);
                }
            }
        } catch (error) {
            console.error('Scheduler error:', error);
        }
    });

    console.log('Scheduler started!');
};

export default startScheduler;