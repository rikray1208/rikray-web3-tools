export class Utils {
  static async sleepFn(seconds: number) {
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
  }

  static getDeadLine(minutes: number) {
    const now = Date.now()
    const milliseconds = minutes * 60 * 1000
    return Math.floor((now + milliseconds) / 1000)
  }

  static increaseNumber(value: number, percentage: number) {
    return Math.round(value + (value * (percentage / 100)))
  }
}