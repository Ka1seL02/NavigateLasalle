import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

const hashedPassword = await bcrypt.hash('Admin@1234', 10);

await mongoose.connection.collection('admins').insertOne({
  name: 'Admin',
  email: 'navigatelasalle@gmail.com',
  password: hashedPassword,
  createdAt: new Date()
});

console.log('Admin account created!');
await mongoose.connection.close();