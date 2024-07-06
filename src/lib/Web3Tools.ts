import { ethers, JsonRpcProvider, TransactionReceipt, TransactionRequest, Wallet } from 'ethers';

import { Utils } from './Utils';
import { ERC20_ABI } from '../ABI';

import type { GetTokenAmountResponse, IWeb3Tools, LogFunc } from '../interfaces';

export class Web3Tools implements IWeb3Tools {
  private readonly DEFAULT_TIMEOUT = 360 * 1000

  constructor(
    public readonly provider: JsonRpcProvider,
    public readonly wallet: Wallet,
    public readonly acceleration: number,
    public readonly sleep?: number,
    public readonly logFunc: LogFunc = console.log,
  ) {}

  public async getTokenAmount(
    isNative: boolean,
    tokenAddress: string,
    amount: number,
    allAmount: boolean,
  ): Promise<GetTokenAmountResponse> {
    const data = {
      valueWei: 0,
      valueEther: 0,
      balance: 0,
      valueWeiBigint: 0n,
    };

    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    const decimals: bigint = await contract.decimals();
    const balanceWei: bigint = await contract.balanceOf(this.wallet.address);

    const balanceEther = Number(balanceWei) / Number(10n ** decimals);
    data.balance = balanceEther;

    if (allAmount) {
      if (isNative) {
        data.valueWei = Number((balanceWei * 99n) / 100n);
        data.valueWeiBigint = (balanceWei * 99n) / 100n;
        data.valueEther = parseFloat((balanceEther * 0.99).toFixed(7));
      } else {
        data.valueWei = Number(balanceWei);
        data.valueWeiBigint = balanceWei;
        data.valueEther = parseFloat(balanceEther.toFixed(7));
      }
    } else {
      data.valueWei = amount * 10 ** Number(decimals);
      data.valueWeiBigint = BigInt(data.valueWei);
      data.valueEther = parseFloat(amount.toFixed(7));
    }

    return data;
  }

  public async getAllowance(tokenAddress: string, contractAddress: string): Promise<number> {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.wallet);
    return await contract.allowance(this.wallet.address, contractAddress);
  }

  public async approve(
    tokenName: string,
    tokenAddress: string,
    contractAddress: string,
    amountWei: number | bigint,
  ): Promise<void> {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.wallet);
    const allowance = await this.getAllowance(tokenAddress, contractAddress);

    if (amountWei > allowance) {
      const tx: TransactionRequest = {
        to: tokenAddress,
        value: 0,
        data: null,
      };

      tx.data = contract.interface.encodeFunctionData('0x095ea7b3', [
        contractAddress,
        amountWei.toString(),
      ]);

      await this.sendTransaction(tx, `${tokenName} approve`);
    }
  }

  public async withdrawWETH(wethAddress: string): Promise<TransactionReceipt> {
    const tokenContract = new ethers.Contract(wethAddress, ERC20_ABI, this.wallet);
    const amountWei = await tokenContract.balanceOf(this.wallet.address);

    const tx: TransactionRequest = {
      to: wethAddress,
      data: null,
    };

    tx.data = tokenContract.interface.encodeFunctionData('withdraw', [amountWei]);

    return await this.sendTransaction(tx, 'Withdraw');
  }

  public async sendTransaction(
    tx: TransactionRequest,
    logMessage: string = 'sendTransaction',
    timeout: number = this.DEFAULT_TIMEOUT
  ): Promise<TransactionReceipt> {
    const estimateGas = await this.wallet.estimateGas(tx);
    const gasLimit = Utils.increaseNumber(Number(estimateGas), 30);
    const gasPrice = await this.getIncreasedGasPrice();
    const txResponse = await this.wallet.sendTransaction({ ...tx, gasPrice, gasLimit });
    this.logFunc(`${this.wallet.address}: ${logMessage} started, hash: ${txResponse.hash}`);
    const txReceipt = await txResponse.wait(1, timeout);
    this.logFunc(`${this.wallet.address}: ${logMessage} finished, hash: ${txResponse.hash}`);
    if (this.sleep) {
      this.logFunc(`${this.wallet.address}: sleep for ${this.sleep} seconds`);
      await Utils.sleepFn(this.sleep);
    }

    return txReceipt;
  }

  private async getIncreasedGasPrice(): Promise<number> {
    const gasPrice = Number((await this.provider.getFeeData()).gasPrice);
    return Utils.increaseNumber(gasPrice, this.acceleration);
  }
}
