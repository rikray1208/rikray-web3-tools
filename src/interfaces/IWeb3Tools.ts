import { JsonRpcProvider, TransactionReceipt, TransactionRequest, Wallet } from 'ethers';

export interface IWeb3Tools {
  readonly provider: JsonRpcProvider;
  readonly wallet: Wallet;
  readonly acceleration: number;
  readonly sleep?: number;
  readonly logFunc?: LogFunc;

  getTokenAmount: (
    isNative: boolean,
    tokenAddress: string,
    amount: number,
    allAmount: boolean,
  ) => Promise<GetTokenAmountResponse>;
  getAllowance: (tokenAddress: string, contractAddress: string) => Promise<number>;
  approve: (
    tokenName: string,
    tokenAddress: string,
    contractAddress: string,
    amountWei: number | bigint,
  ) => Promise<void>;
  withdrawWETH: (wethAddress: string) => Promise<TransactionReceipt>;
  sendTransaction: (tx: TransactionRequest, logMessage?: string, timeout?: number) => Promise<TransactionReceipt>;
}

export interface GetTokenAmountResponse {
  valueWei: number;
  valueWeiBigint: bigint;
  valueEther: number;
  balance: number;
}

export type LogFunc = (message: string) => void;
