/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context } from 'fabric-contract-api';
import { ChaincodeStub, ClientIdentity } from 'fabric-shim';
import { UserWalletContract } from '.';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import winston = require('winston');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

class TestContext implements Context {
    public stub: sinon.SinonStubbedInstance<ChaincodeStub> = sinon.createStubInstance(ChaincodeStub);
    public clientIdentity: sinon.SinonStubbedInstance<ClientIdentity> = sinon.createStubInstance(ClientIdentity);
    public logging = {
        getLogger: sinon.stub().returns(sinon.createStubInstance(winston.createLogger().constructor)),
        setLevel: sinon.stub(),
     };
}

describe('UserWalletContract', () => {

    let contract: UserWalletContract;
    let ctx: TestContext;

    beforeEach(() => {
        contract = new UserWalletContract();
        ctx = new TestContext();
        ctx.stub.getState.withArgs('1001').resolves(Buffer.from('{"value":"user wallet 1001 value"}'));
        ctx.stub.getState.withArgs('1002').resolves(Buffer.from('{"value":"user wallet 1002 value"}'));
    });

    describe('#userWalletExists', () => {

        it('should return true for a user wallet', async () => {
            await contract.userWalletExists(ctx, '1001').should.eventually.be.true;
        });

        it('should return false for a user wallet that does not exist', async () => {
            await contract.userWalletExists(ctx, '1003').should.eventually.be.false;
        });

    });

    describe('#createUserWallet', () => {

        it('should create a user wallet', async () => {
            await contract.createUserWallet(ctx, '1003', 'user wallet 1003 value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1003', Buffer.from('{"value":"user wallet 1003 value"}'));
        });

        it('should throw an error for a user wallet that already exists', async () => {
            await contract.createUserWallet(ctx, '1001', 'myvalue').should.be.rejectedWith(/The user wallet 1001 already exists/);
        });

    });

    describe('#readUserWallet', () => {

        it('should return a user wallet', async () => {
            await contract.readUserWallet(ctx, '1001').should.eventually.deep.equal({ value: 'user wallet 1001 value' });
        });

        it('should throw an error for a user wallet that does not exist', async () => {
            await contract.readUserWallet(ctx, '1003').should.be.rejectedWith(/The user wallet 1003 does not exist/);
        });

    });

    describe('#updateUserWallet', () => {

        it('should update a user wallet', async () => {
            await contract.updateUserWallet(ctx, '1001', 'user wallet 1001 new value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1001', Buffer.from('{"value":"user wallet 1001 new value"}'));
        });

        it('should throw an error for a user wallet that does not exist', async () => {
            await contract.updateUserWallet(ctx, '1003', 'user wallet 1003 new value').should.be.rejectedWith(/The user wallet 1003 does not exist/);
        });

    });

    describe('#deleteUserWallet', () => {

        it('should delete a user wallet', async () => {
            await contract.deleteUserWallet(ctx, '1001');
            ctx.stub.deleteState.should.have.been.calledOnceWithExactly('1001');
        });

        it('should throw an error for a user wallet that does not exist', async () => {
            await contract.deleteUserWallet(ctx, '1003').should.be.rejectedWith(/The user wallet 1003 does not exist/);
        });

    });

});
