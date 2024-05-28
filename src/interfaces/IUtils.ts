export interface IUtils {
  sleepFn: (seconds: number) => Promise<void>
  getDeadLine: (minutes: number) => number
  increaseNumber: (value: number, percentage: number) => number
}