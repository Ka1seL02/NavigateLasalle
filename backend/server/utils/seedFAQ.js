import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FAQ from '../models/FAQ.js';

dotenv.config();

const faqs = [
    { question: 'What are the campus operating hours?', answer: 'The campus is open from 7:00 AM to 8:00 PM on weekdays and 8:00 AM to 5:00 PM on Saturdays. The campus is closed on Sundays and holidays.', isVisible: true },
    { question: "Where is the Registrar's Office located?", answer: "The Registrar's Office is located at the Administration Building, Ground Floor, Room 101.", isVisible: true },
    { question: 'How do I get a copy of my transcript of records?', answer: 'You may request a copy of your transcript of records at the Registrar\'s Office. Processing takes 3-5 working days. Make sure to bring a valid school ID.', isVisible: true },
    { question: 'Where is the library located and what are its hours?', answer: 'The library is located at the Learning Resource Center Building, 2nd Floor. It is open from 7:30 AM to 7:00 PM on weekdays and 8:00 AM to 4:00 PM on Saturdays.', isVisible: true },
    { question: 'How do I connect to the campus Wi-Fi?', answer: 'Connect to the network named "DLSUD-Student" and log in using your student ID number as both the username and password. For issues, visit the ICT Office at the Main Building, Room 203.', isVisible: true },
    { question: 'Where is the Guidance Office located?', answer: 'The Guidance Office is located at the Student Services Building, Ground Floor. It is open from 8:00 AM to 5:00 PM on weekdays.', isVisible: true },
    { question: 'How do I apply for a leave of absence?', answer: 'You may apply for a leave of absence by filling out the Leave of Absence form available at the Registrar\'s Office. Submit the completed form along with a letter of explanation and your parent\'s or guardian\'s consent.', isVisible: true },
    { question: 'Where can I pay my tuition fees?', answer: "Tuition fees can be paid at the Cashier's Office located at the Administration Building, Ground Floor, Room 103. You may also pay online through the student portal.", isVisible: true },
    { question: 'Where is the campus clinic located?', answer: 'The campus clinic is located at the Student Services Building, Ground Floor, beside the Guidance Office. It is open from 7:30 AM to 5:30 PM on weekdays.', isVisible: true },
    { question: 'How do I report a lost ID?', answer: "Report your lost ID immediately to the Security Office at the main entrance. You may apply for a replacement ID at the Registrar's Office. A replacement fee will be charged.", isVisible: true },
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');

        let inserted = 0;
        let skipped = 0;

        for (const faq of faqs) {
            const exists = await FAQ.findOne({ question: faq.question });
            if (exists) {
                console.log(`⏭️ Skipping existing: "${faq.question}"`);
                skipped++;
                continue;
            }
            await FAQ.create(faq);
            console.log(`✅ Seeded: "${faq.question}"`);
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