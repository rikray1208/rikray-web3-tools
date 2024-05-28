import { IUtils } from "../interfaces"

export class Utils implements IUtils {
  public async sleepFn(seconds: number) {
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
  }

  public getDeadLine(minutes: number) {
    const now = Date.now()
    const milliseconds = minutes * 60 * 1000
    return Math.floor((now + milliseconds) / 1000)
  }

  public increaseNumber(value: number, percentage: number) {
    return Math.round(value + (value * (percentage / 100)))
  }
}