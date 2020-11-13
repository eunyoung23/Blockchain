/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { UserWallet } from './user-wallet';

@Info({title: 'UserWalletContract', description: 'My Smart Contract' })
export class UserWalletContract extends Contract {

    @Transaction(false)
    @Returns('boolean')
    public async userWalletExists(ctx: Context, userPublicId: string): Promise<boolean> {
        const buffer = await ctx.stub.getState(userPublicId);
        return (!!buffer && buffer.length > 0);
    }

    @Transaction()
    public async createUserWallet(ctx: Context, userPublicId: string, userId: string, token: number): Promise<void> {
        const exists = await this.userWalletExists(ctx, userPublicId);
        if (exists) {
            throw new Error(`The user wallet ${userPublicId} already exists`);
        }
        const userWallet = new UserWallet();
        userWallet.token = token;
        userWallet.userId = userId;
        const buffer = Buffer.from(JSON.stringify(userWallet));
        await ctx.stub.putState(userPublicId, buffer);
    }

    @Transaction(false)
    @Returns('UserWallet')
    public async readUserWallet(ctx: Context, userPublicId: string): Promise<UserWallet> {
        const exists = await this.userWalletExists(ctx, userPublicId);
        if (!exists) {
            throw new Error(`The user wallet ${userPublicId} does not exist`);
        }
        const buffer = await ctx.stub.getState(userPublicId);
        const userWallet = JSON.parse(buffer.toString()) as UserWallet;
        console.log(buffer.toString());
        return userWallet;
    }

    @Transaction()
    public async updateUserToken(ctx: Context, userPublicId: string, newtoken: number): Promise<void> {
        const exists = await this.userWalletExists(ctx, userPublicId);
        if (!exists) {
            throw new Error(`The user wallet ${userPublicId} does not exist`);
        }
        const wallet = await ctx.stub.getState(userPublicId);
        const userWallet = JSON.parse(wallet.toString()) as UserWallet;
        userWallet.token = newtoken;

        const buffer = Buffer.from(JSON.stringify(userWallet));
        await ctx.stub.putState(userPublicId, buffer);
    }

    @Transaction()
    public async deleteUserWallet(ctx: Context, userPublicId: string): Promise<void> {
        const exists = await this.userWalletExists(ctx, userPublicId);
        if (!exists) {
            throw new Error(`The user wallet ${userPublicId} does not exist`);
        }
        await ctx.stub.deleteState(userPublicId);
    }

    @Transaction()
    public async transferToken(ctx: Context, giverPublicId: string,receiverPublicId: string, amount:number): Promise<void> {
        const giverAsBytes = await ctx.stub.getState(giverPublicId); 
        const receiverAsBytes = await ctx.stub.getState(receiverPublicId); 
        // get giver and receiver from chaincode state
        if (!giverAsBytes|| giverAsBytes.length === 0) {
            throw new Error(`${giverPublicId} does not exist`);
        }
        else if (!receiverAsBytes|| receiverAsBytes.length === 0) {
            throw new Error(`${receiverPublicId} does not exist`);
        }
        const gWallet = await ctx.stub.getState(giverPublicId);
        const giverWallet = JSON.parse(gWallet.toString()) as UserWallet;
        if(giverWallet.token<amount){
            //주는 이가 지갑 잔액보다 큰 액수를 보내려 할 때
            throw new Error(`$[giverPublicId] doesn't have enough token`)
        }
        const rWallet = await ctx.stub.getState(receiverPublicId);
        const receiverWallet = JSON.parse(rWallet.toString()) as UserWallet;

        giverWallet.token -= amount;
        receiverWallet.token +=amount;
        
        await ctx.stub.putState(giverPublicId,Buffer.from(JSON.stringify(giverWallet)));
        await ctx.stub.putState(receiverPublicId, Buffer.from(JSON.stringify(receiverWallet)));
    }

    @Transaction(false)
    public async queryAllWallets(ctx: Context): Promise<string> {
        const startKey = '';
        const endKey = '';
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange(startKey, endKey);
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }
}
