import { JsonRpcProvider, TransactionReceipt, TransactionRequest, Wallet } from "ethers"

export interface IWeb3Tools {
  readonly provider: JsonRpcProvider,
  readonly wallet: Wallet
  readonly acceleration: number
  readonly sleep?: number

  sleepFn: (seconds: number) => Promise<void>
  getIncreasedGasPrice: () => Promise<number>
  getTokenAmount: (
    tokenName: string,
    tokenAddress: string,
    amount: number,
    allAmount: boolean
  ) => Promise<GetTokenAmountResponse>
  getAllowance: (tokenAddress: string, contractAddress: string) => Promise<number>
  approve: (tokenName: string, tokenAddress: string, contractAddress: string, amountWei: number) => Promise<void>
  sendTransaction: (tx: TransactionRequest, logMessage?: string) => Promise<TransactionReceipt>
}

export interface GetTokenAmountResponse {
  valueWei: number,
  valueEther: number,
  balance: number
}