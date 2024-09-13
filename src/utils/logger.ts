export class Logger {
  public info(message: string): void {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
  }

  public error(message: string, error?: Error): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
    if (error) {
      console.error(error);
    }
  }
}