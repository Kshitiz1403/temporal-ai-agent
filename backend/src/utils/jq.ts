import logger from "@/loaders/logger";

const nodeJq = require("node-jq");

export const evaluateJQ = async (jqExpression: string, data: any) => {
  logger.info(`------ JQ Expression: ${jqExpression} -------`);
  logger.info(`------ Data to JQ Evaluate : ${JSON.stringify(data)} -------`);
  try {
    const result = await nodeJq.run(jqExpression, data, {
      input: "json",
      output: "json",
    });
    logger.info(
      `------ JQ Result: ${JSON.stringify(result) || result} -------`
    );
    return result;
  } catch (error) {
    logger.error("Error evaluating jq expression:", error);
    throw error;
  }
};
