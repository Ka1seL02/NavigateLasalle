import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CampusInfo from '../models/CampusInfo.js';

dotenv.config();

const sections = [
    {
        key: 'mission',
        label: 'Mission',
        type: 'rich_text',
        icon: null,
        content: `<p>De La Salle University - Dasmariñas is a Catholic educational institution that provides quality human and Christian education in the Lasallian tradition. It is committed to forming competent, morally upright, and service-oriented individuals who are dedicated to the development of society and the Church.</p>`
    },
    {
        key: 'vision',
        label: 'Vision',
        type: 'rich_text',
        icon: null,
        content: `<p>De La Salle University - Dasmariñas envisions itself as a leading Catholic university in Asia — one that forms its students to be morally upright, professionally competent, and genuinely committed to service for God and country.</p>`
    },
    {
        key: 'about',
        label: 'About DLSU-D',
        type: 'rich_text',
        icon: null,
        content: `<p>De La Salle University - Dasmariñas (DLSU-D) is a private Catholic university located in Dasmariñas, Cavite, Philippines. It was established in 1977 as De La Salle College - Dasmariñas by the De La Salle Brothers and was granted university status in 1993.</p>
        <p>DLSU-D is part of the De La Salle Philippines (DLSP) network, a system of Lasallian schools committed to providing quality education rooted in the Catholic faith and the educational mission of Saint John Baptist de La Salle.</p>
        <p>The university offers programs across various disciplines including the arts and sciences, business, engineering, education, health sciences, law, and information technology, serving thousands of students from Cavite and neighboring provinces.</p>`
    },
    {
        key: 'core_value_1',
        label: 'Faith',
        type: 'core_value',
        icon: 'bx-church',
        content: `<p>A deep commitment to God and the Catholic tradition as expressed through the Lasallian charism. Faith is the foundation of everything we do — in our classrooms, our communities, and our service to others.</p>`
    },
    {
        key: 'core_value_2',
        label: 'Service',
        type: 'core_value',
        icon: 'bx-donate-heart',
        content: `<p>A genuine dedication to the welfare of others, especially the poor and marginalized. We are called to serve not just our immediate community but society at large, putting others before ourselves.</p>`
    },
    {
        key: 'core_value_3',
        label: 'Communion in Mission',
        type: 'core_value',
        icon: 'bx-group',
        content: `<p>A collaborative spirit in working together toward the shared mission of quality Catholic education. We believe that together — students, faculty, staff, and the broader Lasallian community — we accomplish more.</p>`
    },
    {
        key: 'hymn',
        label: 'Alma Mater Hymn',
        type: 'rich_text',
        icon: null,
        content: `<p><em>Please update this section with the official DLSU-D Alma Mater Hymn lyrics.</em></p>`
    },
    {
        key: 'contact',
        label: 'Contact Information',
        type: 'rich_text',
        icon: null,
        content: `<p><em>Please update this section with the official DLSU-D contact information including address, telephone numbers, email addresses, and social media links.</em></p>`
    }
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');

        let inserted = 0;
        let skipped = 0;

        for (const section of sections) {
            const exists = await CampusInfo.findOne({ key: section.key });
            if (exists) {
                console.log(`⏭️ Skipping existing: "${section.label}"`);
                skipped++;
                continue;
            }
            await CampusInfo.create(section);
            console.log(`✅ Seeded: "${section.label}"`);
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