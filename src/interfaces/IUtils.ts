export abstract class IUtils {
  static sleepFn: (seconds: number) => Promise<void>;
  static getDeadLine: (minutes: number) => number;
  static increaseNumber: (value: number, percentage: number) => number;
}
