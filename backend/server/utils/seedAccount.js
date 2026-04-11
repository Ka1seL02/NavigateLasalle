import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';

dotenv.config();

const admins = [
    { name: 'Super Admin', email: 'navigatelasalle@gmail.com', role: 'superadmin' },
    { name: 'Juan Dela Cruz', email: 'juan.delacruz@gmail.com', role: 'admin' },
    { name: 'Maria Santos', email: 'maria.santos@gmail.com', role: 'admin' },
    { name: 'Jose Reyes', email: 'jose.reyes@gmail.com', role: 'admin' },
    { name: 'Ana Garcia', email: 'ana.garcia@gmail.com', role: 'admin' },
    { name: 'Carlos Mendoza', email: 'carlos.mendoza@gmail.com', role: 'admin' },
    { name: 'Rosa Flores', email: 'rosa.flores@gmail.com', role: 'admin' },
    { name: 'Miguel Torres', email: 'miguel.torres@gmail.com', role: 'admin' },
    { name: 'Sofia Ramos', email: 'sofia.ramos@gmail.com', role: 'admin' },
    { name: 'Pedro Aquino', email: 'pedro.aquino@gmail.com', role: 'admin' },
    { name: 'Lucia Bautista', email: 'lucia.bautista@gmail.com', role: 'admin' },
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');

        const hashedPassword = await bcrypt.hash('Admin@1234', 10);

        let inserted = 0;
        let skipped = 0;

        for (const admin of admins) {
            const exists = await Admin.findOne({ email: admin.email });
            if (exists) {
                console.log(`⏭️ Skipping existing: ${admin.email}`);
                skipped++;
                continue;
            }
            await Admin.create({ ...admin, password: hashedPassword, createdAt: new Date() });
            console.log(`✅ Seeded: ${admin.email}`);
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