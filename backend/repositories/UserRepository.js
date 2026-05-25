// Repository Pattern: abstracts all User data-access logic away from controllers
const User = require('../models/User');

class UserRepository {
    findById(id, projection = '-password') {
        return User.findById(id).select(projection);
    }

    findByEmail(email) {
        return User.findOne({ email });
    }

    create(data) {
        return User.create(data);
    }

    save(user) {
        return user.save();
    }
}

module.exports = new UserRepository();
