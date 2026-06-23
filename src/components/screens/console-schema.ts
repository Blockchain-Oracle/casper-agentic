export interface ConsoleSchemaTool {
  inputSchema?: Record<string, unknown>;
  name: string;
}

export interface ConsoleInputField {
  defaultValue: string;
  name: string;
  options: string[];
  required: boolean;
}

const GET_QUOTE_DEFAULTS: Record<string, string> = {
  amount: "10",
  token_in: "CSPR",
  token_out: "WCSPR",
  type: "exact_in",
};

export function inputFieldsForTool(tool: ConsoleSchemaTool | null | undefined) {
  if (!tool) return [];
  const schema = isRecord(tool.inputSchema) ? tool.inputSchema : {};
  const properties = isRecord(schema.properties) ? schema.properties : {};
  const required = new Set(Array.isArray(schema.required) ? schema.required.filter(isString) : []);
  const fields = Object.entries(properties).map(([name, value]) => {
    const field = isRecord(value) ? value : {};
    const options = Array.isArray(field.enum) ? field.enum.filter(isString) : [];
    return {
      defaultValue: stringDefault(field.default) ?? GET_QUOTE_DEFAULTS[name] ?? "",
      name,
      options,
      required: required.has(name),
    } satisfies ConsoleInputField;
  });

  if (fields.length) return fields;
  if (tool.name === "get_quote") {
    return Object.entries(GET_QUOTE_DEFAULTS).map(([name, defaultValue]) => ({
      defaultValue,
      name,
      options: name === "type" ? ["exact_in", "exact_out"] : [],
      required: true,
    }));
  }
  return [];
}

function stringDefault(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}
