// Factory Pattern: centralises creation of all HTTP response objects
class ResponseFactory {
    static success(res, data, statusCode = 200) {
        return res.status(statusCode).json({ success: true, data });
    }

    static created(res, data) {
        return ResponseFactory.success(res, data, 201);
    }

    static error(res, message, statusCode = 500) {
        return res.status(statusCode).json({ success: false, message });
    }

    static notFound(res, resource = 'Resource') {
        return res.status(404).json({ success: false, message: `${resource} not found` });
    }

    static unauthorized(res, message = 'Not authorized') {
        return res.status(401).json({ success: false, message });
    }

    static badRequest(res, message) {
        return res.status(400).json({ success: false, message });
    }
}

module.exports = ResponseFactory;
