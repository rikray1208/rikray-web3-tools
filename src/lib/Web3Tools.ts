import { ethers, JsonRpcProvider, TransactionRequest, Wallet } from "ethers"
import { ERC20_ABI } from "../ABI"
import { IWeb3Tools } from "../interfaces"
import { Utils } from "./Utils"

export class Web3Tools implements IWeb3Tools {
  constructor(
    public readonly provider: JsonRpcProvider,
    public readonly wallet: Wallet,
    public readonly acceleration: number,
    public readonly sleep?: number
  ) {}

  public async sleepFn(seconds: number) {
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
  }
  public async getIncreasedGasPrice() {
    const gasPrice = Number((await this.provider.getFeeData()).gasPrice)
    return Utils.increaseNumber(gasPrice, this.acceleration)
  }

  public async getTokenAmount(tokenName: string, tokenAddress: string, amount: number, allAmount: boolean) {
    const data = {
      valueWei: 0,
      valueEther: 0,
      balance: 0,
    }

    if (tokenName === 'ETH') {
      const balanceWei = Number(await this.provider.getBalance(this.wallet.address))
      const balanceEther = Number(ethers.formatEther(balanceWei.toString()))
      data.balance = balanceEther

      if (allAmount) {
        data.valueWei = Math.floor(balanceWei * 0.99)
        data.valueEther = parseFloat((balanceEther * 0.99).toFixed(7))
      } else {
        if (balanceEther < amount) {
          throw new Error(`${this.wallet.address}: Insufficient balance to swap ${amount} ${tokenName}`)
        }

        data.valueWei = Number(ethers.parseEther(amount.toString()))
        data.valueEther = Number(amount.toFixed(7))
      }
    } else {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)
      const decimals = Number(await contract.decimals())
      const balanceWei = Number(await contract.balanceOf(this.wallet.address))

      const balanceEther = balanceWei / 10 ** decimals
      data.balance = balanceEther

      if (allAmount) {
        data.valueWei = balanceWei
        data.valueEther = parseFloat(balanceEther.toFixed(7))
      } else {
        data.valueWei = amount * 10 ** decimals
        data.valueEther = parseFloat(amount.toFixed(7))
      }
    }

    return data
  }

  public async getAllowance(tokenAddress: string, contractAddress: string): Promise<number> {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.wallet)
    return await contract.allowance(this.wallet.address, contractAddress)
  }

  public async approve(tokenName: string, tokenAddress: string, contractAddress: string, amountWei: number): Promise<void> {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.wallet)
    const allowance = await this.getAllowance(tokenAddress, contractAddress)

    if (amountWei > allowance) {
      const tx: TransactionRequest = {
        to: tokenAddress,
        value: 0,
        data: null
      }

      tx.data = contract.interface.encodeFunctionData('0x095ea7b3', [
        contractAddress,
        amountWei
      ])

      await this.sendTransaction(tx, `${tokenName} approve`)
    }
  }

  public async withdrawWETH(wethAddress: string){
    const tokenContract = new ethers.Contract(wethAddress, ERC20_ABI, this.wallet)
    const amountWei = await tokenContract.balanceOf(this.wallet.address)

    const tx: TransactionRequest = {
      to: wethAddress,
      data: null
    }

    tx.data = tokenContract.interface.encodeFunctionData('withdraw', [amountWei])

    return await this.sendTransaction(tx, 'Withdraw')
  }

  public async sendTransaction(tx: TransactionRequest, logMessage: string = 'sendTransaction') {
    const estimateGas = await this.wallet.estimateGas(tx)
    const gasLimit = Utils.increaseNumber(Number(estimateGas), 30)
    const gasPrice = await this.getIncreasedGasPrice()
    const txResponse = await this.wallet.sendTransaction({...tx, gasPrice, gasLimit})
    process.stdout.write(`${this.wallet.address}: ${logMessage} started, hash: ${txResponse.hash}`)
    const txReceipt  = await txResponse.wait()
    process.stdout.write(`${this.wallet.address}: ${logMessage} finished, hash: ${txResponse.hash}`)
    if (this.sleep) {
      process.stdout.write(`${this.wallet.address}: sleep for ${this.sleep} seconds`)
      await this.sleepFn(this.sleep)
    }

    return txReceipt
  }
}