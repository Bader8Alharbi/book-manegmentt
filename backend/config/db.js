// Singleton Pattern: only one Database instance ever exists.
// Node's module-cache ensures every require('./config/db') returns this same object.
const mongoose = require('mongoose');

class Database {
    constructor() {
        if (Database._instance) return Database._instance;
        Database._instance = this;
        this._connected = false;
    }

    async connect() {
        if (this._connected) return;
        try {
            await mongoose.connect(process.env.MONGO_URI);
            this._connected = true;
            console.log('MongoDB connected successfully');
        } catch (error) {
            console.error('MongoDB connection error:', error.message);
            process.exit(1);
        }
    }
}

const db = new Database();
module.exports = db;
