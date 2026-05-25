// OOP – Inheritance: AdminController extends BaseController for shared helpers.
// Repository-style: all DB access concentrated in the controller methods.
// Encapsulation: each admin operation is a single async method on the class.
const BaseController = require('./BaseController');
const User = require('../models/User');
const Book = require('../models/Book');
const DeletedRecord = require('../models/DeletedRecord');

class AdminController extends BaseController {

    // GET /api/admin/users
    async getAllUsers(req, res) {
        try {
            const users = await User.find().select('-password');
            res.status(200).json(users);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    // DELETE /api/admin/users/:id
    async deleteUser(req, res) {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return this.notFound(res, 'User');
            if (user.role === 'admin') {
                return this.badRequest(res, 'Cannot delete admin');
            }
            await DeletedRecord.create({
                recordType: 'user',
                data: user.toObject(),
                deletedBy: req.user._id,
            });
            await user.deleteOne();
            res.status(200).json({ message: 'User deleted' });
        } catch (error) {
            this.handleError(res, error);
        }
    }

    // GET /api/admin/borrowed
    async getBorrowedBooks(req, res) {
        try {
            const books = await Book.find({ status: 'borrowed' })
                .populate('borrowedBy', 'name email')
                .populate('createdBy', 'name email');
            res.status(200).json(books);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    // GET /api/admin/history
    async getHistory(req, res) {
        try {
            const records = await DeletedRecord.find()
                .populate('deletedBy', 'name email')
                .sort({ createdAt: -1 });
            res.status(200).json(records);
        } catch (error) {
            this.handleError(res, error);
        }
    }
}

const adminController = new AdminController();

module.exports = {
    getAllUsers:      adminController.getAllUsers.bind(adminController),
    deleteUser:       adminController.deleteUser.bind(adminController),
    getBorrowedBooks: adminController.getBorrowedBooks.bind(adminController),
    getHistory:       adminController.getHistory.bind(adminController),
};
