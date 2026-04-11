import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Feedback from '../models/Feedback.js';

dotenv.config();

const feedbacks = [
    { rating: 5, comment: 'Very helpful! Found the office I was looking for easily.', isRead: false },
    { rating: 4, comment: 'Great system, but the map could be a bit more detailed.', isRead: false },
    { rating: 5, comment: 'Love the interface, very intuitive and easy to use.', isRead: true },
    { rating: 3, comment: 'It works fine but sometimes the directions are a bit confusing.', isRead: true },
    { rating: 5, comment: null, isRead: false },
    { rating: 2, comment: 'Some office information seems outdated.', isRead: false },
    { rating: 4, comment: 'Really useful for first-time visitors to the campus.', isRead: true },
    { rating: 1, comment: 'The kiosk near the gate was not working properly.', isRead: false },
    { rating: 5, comment: 'Exactly what the campus needed. Very well made!', isRead: false },
    { rating: 3, comment: null, isRead: true },
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');

        let inserted = 0;
        let skipped = 0;

        for (const feedback of feedbacks) {
            // Skip if exact same rating and comment already exists
            const exists = await Feedback.findOne({
                rating: feedback.rating,
                comment: feedback.comment
            });
            if (exists) {
                console.log(`⏭️ Skipping existing: rating ${feedback.rating} — "${feedback.comment}"`);
                skipped++;
                continue;
            }
            await Feedback.create(feedback);
            console.log(`✅ Seeded: rating ${feedback.rating} — "${feedback.comment}"`);
            inserted++;
        }

        console.log(`\n🎉 Done! Inserted: ${inserted}, Skipped: ${skipped}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed failed:', err.message);
        process.exit(1);
    }
};

seed();