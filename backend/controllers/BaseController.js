// OOP – Abstraction: BaseController is an abstract-like base class.
// It defines the shared interface and common behaviour all controllers must have.
// Subclasses inherit these methods and can override them (Polymorphism).
class BaseController {
    // Abstract-like method — defines interface; subclasses may override (Polymorphism)
    handleError(res, error) {
        return res.status(500).json({ message: error.message });
    }

    notFound(res, resource = 'Resource') {
        return res.status(404).json({ message: `${resource} not found` });
    }

    badRequest(res, message) {
        return res.status(400).json({ message });
    }

    // Shared success response — inherited by all subclasses
    sendSuccess(res, data, statusCode = 200) {
        return res.status(statusCode).json({ success: true, data });
    }
}

module.exports = BaseController;
