import config from "@/config/config";
import winston from "winston";

const transports = [];

transports.push(
  new winston.transports.Console({
    format: winston.format.combine(winston.format.cli()),
  })
);

// if (config.nodeEnv === "prod") {
transports.push(
  new winston.transports.File({ filename: "logs/error.log", level: "error" }),
  new winston.transports.File({ filename: "logs/combined.log" })
);
// }

const baseLogger = winston.createLogger({
  level: config.logs.level,
  levels: winston.config.npm.levels,
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.timestamp({
      // format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports,
});

class Logger {
  private logger: winston.Logger;
  private contextData: Record<string, any> = {};

  constructor(contextData = {}) {
    this.contextData = contextData;
    this.logger = baseLogger;
  }

  private getFullMessage(message: any, args: any[]) {
    return `${message} ${args
      .map((arg) => {
        switch (typeof arg) {
          case "object": {
            return JSON.stringify(arg);
          }
          default:
            return arg;
        }
      })
      .join("\n")}`;
  }

  private with(key: string, value: any) {
    return new Logger({
      ...this.contextData,
      [key]: value,
    });
  }

  withClient(clientID: string) {
    return this.with("clientID", clientID);
  }

  withWorkflow(workflowID: string) {
    return this.with("workflowID", workflowID);
  }

  withUser(userID: string) {
    return this.with("userID", userID);
  }

  info(message: any, ...args) {
    const fullMessage = this.getFullMessage(message, args);

    const meta = [...args];
    this.logger.info(fullMessage, { ...this.contextData, meta });
    return new Logger(this.contextData);
  }

  error(message: any, ...args) {
    const fullMessage = this.getFullMessage(message, args);

    const stackMsg = message.stack
      ? message.stack + "\n"
      : "" + args.map((arg) => arg.stack).join("\n");

    const meta = [...args];

    this.logger.error(fullMessage, {
      ...this.contextData,
      stackTrace: stackMsg,
      meta,
    });
    return new Logger(this.contextData);
  }

  warn(message: any, ...args) {
    const fullMessage = this.getFullMessage(message, args);
    const meta = [...args];

    this.logger.warn(fullMessage, { ...this.contextData, meta });
    return new Logger(this.contextData);
  }

  debug(message: any, ...args) {
    const fullMessage = this.getFullMessage(message, args);
    const meta = [...args];

    this.logger.debug(fullMessage, { ...this.contextData, meta });
    return new Logger(this.contextData);
  }

  silly(message: any, ...args) {
    const fullMessage = this.getFullMessage(message, args);
    const meta = [...args];

    this.logger.silly(fullMessage, { ...this.contextData, meta });
    return new Logger(this.contextData);
  }
}

const logger = new Logger();

export default logger;
