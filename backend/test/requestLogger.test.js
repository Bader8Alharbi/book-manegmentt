const chai = require('chai');
const sinon = require('sinon');
const requestLogger = require('../middleware/RequestLoggerMiddleware');
const { expect } = chai;

describe('RequestLoggerMiddleware', () => {

    it('should call next()', () => {
        const req = { method: 'GET', originalUrl: '/api/books' };
        const res = { on: sinon.stub(), statusCode: 200 };
        const next = sinon.spy();

        requestLogger(req, res, next);

        expect(next.calledOnce).to.be.true;
    });

    it('should register a finish listener on the response', () => {
        const req = { method: 'POST', originalUrl: '/api/auth/login' };
        const res = { on: sinon.stub(), statusCode: 201 };
        const next = sinon.stub();

        requestLogger(req, res, next);

        expect(res.on.calledWith('finish')).to.be.true;
    });
});
