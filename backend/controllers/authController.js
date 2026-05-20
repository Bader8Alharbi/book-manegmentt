// OOP – Inheritance: AuthController extends BaseController.
// Encapsulation: token generation is a private helper inside the class.
const BaseController = require('./BaseController');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class AuthController extends BaseController {
    // Encapsulated private helper — not exported
    _generateToken(id) {
        return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    }

    async registerUser(req, res) {
        const { name, email, password } = req.body;
        try {
            const userExists = await User.findOne({ email });
            if (userExists) return this.badRequest(res, 'User already exists');

            const user = await User.create({ name, email, password });
            res.status(201).json({
                id: user.id, name: user.name, email: user.email, role: user.role,
                token: this._generateToken(user.id),
            });
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async loginUser(req, res) {
        const { email, password } = req.body;
        try {
            const user = await User.findOne({ email });
            if (user && (await bcrypt.compare(password, user.password))) {
                res.json({
                    id: user.id, name: user.name, email: user.email, role: user.role,
                    token: this._generateToken(user.id),
                });
            } else {
                res.status(401).json({ message: 'Invalid email or password' });
            }
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async getProfile(req, res) {
        try {
            const user = await User.findById(req.user.id);
            if (!user) return this.notFound(res, 'User');
            res.status(200).json({
                name: user.name, email: user.email,
                university: user.university, address: user.address,
            });
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async updateUserProfile(req, res) {
        try {
            const user = await User.findById(req.user.id);
            if (!user) return this.notFound(res, 'User');

            const { name, email, university, address } = req.body;
            user.name       = name       || user.name;
            user.email      = email      || user.email;
            user.university = university || user.university;
            user.address    = address    || user.address;

            const updatedUser = await user.save();
            res.json({
                id: updatedUser.id, name: updatedUser.name, email: updatedUser.email,
                university: updatedUser.university, address: updatedUser.address,
                token: this._generateToken(updatedUser.id),
            });
        } catch (error) {
            this.handleError(res, error);
        }
    }
}

const controller = new AuthController();

module.exports = {
    registerUser:      controller.registerUser.bind(controller),
    loginUser:         controller.loginUser.bind(controller),
    getProfile:        controller.getProfile.bind(controller),
    updateUserProfile: controller.updateUserProfile.bind(controller),
};
