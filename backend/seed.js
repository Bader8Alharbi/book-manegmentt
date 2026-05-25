require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const ADMIN_NAME = 'Admin';
const ADMIN_EMAIL = 'admin@library.com';
const ADMIN_PASSWORD = 'Admin@1234';

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const exists = await User.findOne({ email: ADMIN_EMAIL });
    if (exists) {
        if (exists.role !== 'admin') {
            exists.role = 'admin';
            await exists.save();
            console.log('Existing user promoted to admin');
        } else {
            console.log('Admin user already exists');
        }
        await mongoose.disconnect();
        return;
    }

    await User.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' });
    console.log(`Admin created — Email: ${ADMIN_EMAIL} | Password: ${ADMIN_PASSWORD}`);
    await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
