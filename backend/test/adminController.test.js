const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const { getAllUsers, deleteUser, getBorrowedBooks } = require('../controllers/adminController');
const { expect } = chai;


describe('GetAllUsers Function Test', () => {

    it('should return all users without their passwords', async () => {
        const fakeUsers = [
            { _id: new mongoose.Types.ObjectId(), name: 'Admin',    email: 'admin@library.com', role: 'admin'    },
            { _id: new mongoose.Types.ObjectId(), name: 'Customer', email: 'cust@example.com',  role: 'customer' },
        ];

        // chain User.find().select('-password')
        const selectStub = sinon.stub().resolves(fakeUsers);
        const findStub   = sinon.stub(User, 'find').returns({ select: selectStub });

        const req = {};
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await getAllUsers(req, res);

        expect(findStub.calledOnce).to.be.true;
        expect(selectStub.calledWith('-password')).to.be.true;
        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledWith(fakeUsers)).to.be.true;

        findStub.restore();
    });

    it('should return 500 if database error occurs', async () => {
        const selectStub = sinon.stub().rejects(new Error('DB error'));
        const findStub   = sinon.stub(User, 'find').returns({ select: selectStub });

        const req = {};
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await getAllUsers(req, res);

        expect(res.status.calledWith(500)).to.be.true;

        findStub.restore();
    });
});


describe('DeleteUser Function Test', () => {

    it('should delete a customer user successfully', async () => {
        const userId = new mongoose.Types.ObjectId();
        const customer = {
            _id: userId,
            name: 'Customer',
            role: 'customer',
            deleteOne: sinon.stub().resolves(),
        };

        const findByIdStub = sinon.stub(User, 'findById').resolves(customer);

        const req = { params: { id: userId } };
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await deleteUser(req, res);

        expect(customer.deleteOne.calledOnce).to.be.true;
        expect(res.status.calledWith(200)).to.be.true;

        findByIdStub.restore();
    });

    it('should return 404 if the user to delete is not found', async () => {
        const findByIdStub = sinon.stub(User, 'findById').resolves(null);

        const req = { params: { id: new mongoose.Types.ObjectId() } };
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await deleteUser(req, res);

        expect(res.status.calledWith(404)).to.be.true;

        findByIdStub.restore();
    });

    it('should refuse to delete an admin user (400 Bad Request)', async () => {
        const adminUser = {
            _id: new mongoose.Types.ObjectId(),
            name: 'Admin',
            role: 'admin',
            deleteOne: sinon.stub().resolves(),
        };

        const findByIdStub = sinon.stub(User, 'findById').resolves(adminUser);

        const req = { params: { id: adminUser._id } };
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await deleteUser(req, res);

        expect(adminUser.deleteOne.notCalled).to.be.true;
        expect(res.status.calledWith(400)).to.be.true;

        findByIdStub.restore();
    });

    it('should return 500 if database error occurs while deleting', async () => {
        const findByIdStub = sinon.stub(User, 'findById').rejects(new Error('DB error'));

        const req = { params: { id: new mongoose.Types.ObjectId() } };
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await deleteUser(req, res);

        expect(res.status.calledWith(500)).to.be.true;

        findByIdStub.restore();
    });
});


describe('GetBorrowedBooks Function Test', () => {

    it('should return all borrowed books with borrower and creator populated', async () => {
        const borrowedBooks = [
            {
                _id: new mongoose.Types.ObjectId(),
                title: 'The Two Towers',
                status: 'borrowed',
                borrowedBy: { _id: new mongoose.Types.ObjectId(), name: 'Cust', email: 'c@x.com' },
                createdBy:  { _id: new mongoose.Types.ObjectId(), name: 'Admin', email: 'a@x.com' },
            },
        ];

        // chain Book.find().populate().populate()
        const populate2 = sinon.stub().resolves(borrowedBooks);
        const populate1 = sinon.stub().returns({ populate: populate2 });
        const findStub  = sinon.stub(Book, 'find').returns({ populate: populate1 });

        const req = {};
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await getBorrowedBooks(req, res);

        expect(findStub.calledOnceWith({ status: 'borrowed' })).to.be.true;
        expect(populate1.calledWith('borrowedBy', 'name email')).to.be.true;
        expect(populate2.calledWith('createdBy',  'name email')).to.be.true;
        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledWith(borrowedBooks)).to.be.true;

        findStub.restore();
    });

    it('should return 500 if database error occurs', async () => {
        const populate2 = sinon.stub().rejects(new Error('DB error'));
        const populate1 = sinon.stub().returns({ populate: populate2 });
        const findStub  = sinon.stub(Book, 'find').returns({ populate: populate1 });

        const req = {};
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await getBorrowedBooks(req, res);

        expect(res.status.calledWith(500)).to.be.true;

        findStub.restore();
    });
});
