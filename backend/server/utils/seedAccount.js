import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

const hashedPassword = await bcrypt.hash('Admin@1234', 10);

const admins = [
    {
        name: 'Super Admin',
        email: 'navigatelasalle@gmail.com',
        password: hashedPassword,
        role: 'superadmin',
        createdAt: new Date()
    },
    {
        name: 'Juan Dela Cruz',
        email: 'juan.delacruz@gmail.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date()
    },
    {
        name: 'Maria Santos',
        email: 'maria.santos@gmail.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date()
    },
    {
        name: 'Jose Reyes',
        email: 'jose.reyes@gmail.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date()
    },
    {
        name: 'Ana Garcia',
        email: 'ana.garcia@gmail.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date()
    },
    {
        name: 'Carlos Mendoza',
        email: 'carlos.mendoza@gmail.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date()
    },
    {
        name: 'Rosa Flores',
        email: 'rosa.flores@gmail.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date()
    },
    {
        name: 'Miguel Torres',
        email: 'miguel.torres@gmail.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date()
    },
    {
        name: 'Sofia Ramos',
        email: 'sofia.ramos@gmail.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date()
    },
    {
        name: 'Pedro Aquino',
        email: 'pedro.aquino@gmail.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date()
    },
    {
        name: 'Lucia Bautista',
        email: 'lucia.bautista@gmail.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date()
    }
];

await mongoose.connection.collection('admins').insertMany(admins);

console.log('11 admin accounts created!');
await mongoose.connection.close();