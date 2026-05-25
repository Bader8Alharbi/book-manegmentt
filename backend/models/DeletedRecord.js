const mongoose = require('mongoose');

const deletedRecordSchema = new mongoose.Schema(
    {
        recordType: { type: String, enum: ['book', 'user'], required: true },
        data:       { type: mongoose.Schema.Types.Mixed, required: true },
        deletedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('DeletedRecord', deletedRecordSchema);
