import { v4 as uuidv4 } from "uuid";

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const generateUUID = () => uuidv4();

export function extractTemplateValue(input: any): {
  isTemplate: boolean;
  value?: string;
} {
  const start = "${";
  const end = "}";

  // Check if the input starts with '${' and ends with '}'
  if (
    typeof input === "string" &&
    input.startsWith(start) &&
    input.endsWith(end)
  ) {
    // Extract the value between '${' and '}'
    const value = input.slice(start.length, -end.length);
    return {
      isTemplate: true,
      value: value,
    };
  }

  return {
    isTemplate: false,
    value: input,
  };
}
