// Middleware Pattern (Tutorial 7): encapsulates cross-cutting request-logging
// concerns in a class. The handle() method is bound and passed to app.use(),
// keeping logging logic separate from route handlers.
class RequestLoggerMiddleware {
    handle(req, res, next) {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} – ${duration}ms`);
        });
        next();
    }
}

const logger = new RequestLoggerMiddleware();
module.exports = logger.handle.bind(logger);
