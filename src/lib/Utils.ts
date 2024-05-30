import { IUtils } from "../interfaces"

export class Utils implements IUtils {
  static async sleepFn(seconds: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
  }

  static getDeadLine(minutes: number): number {
    const now = Date.now()
    const milliseconds = minutes * 60 * 1000
    return Math.floor((now + milliseconds) / 1000)
  }

  static increaseNumber(value: number, percentage: number): number {
    return Math.round(value + (value * (percentage / 100)))
  }
}