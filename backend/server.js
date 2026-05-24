const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const db = require('./config/db');
const bookRoutes = require('./routes/bookRoutes');
const requestLogger = require('./middleware/RequestLoggerMiddleware');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use('/api/auth',            require('./routes/authRoutes'));
app.use('/api/books',           bookRoutes);
app.use('/api/admin',           require('./routes/adminRoutes'));
app.use('/api/borrow-requests', require('./routes/borrowRequestRoutes'));

if (require.main === module) {
    db.connect();
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
