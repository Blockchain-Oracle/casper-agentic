import { Field } from "@/components/ui";
import type { inputFieldsForTool } from "./console-schema";

type ToolInputField = ReturnType<typeof inputFieldsForTool>[number];

// Dynamic schema-driven inputs for a discovered tool. Renders a select when the
// field enumerates options, otherwise a text input; "No input required" when empty.
export function TestConsoleInputFields({
  inputFields,
  toolArgs,
  updateArg,
}: {
  inputFields: ToolInputField[];
  toolArgs: Record<string, string>;
  updateArg: (name: string, value: string) => void;
}) {
  if (!inputFields.length) {
    return <div className="emptyState">No input required for this tool.</div>;
  }
  return (
    <div className="formGrid">
      {inputFields.map((field) => (
        <Field key={field.name} label={field.required ? `${field.name} *` : field.name}>
          {field.options.length ? (
            <select
              className="input"
              onChange={(event) => updateArg(field.name, event.target.value)}
              value={toolArgs[field.name] ?? field.defaultValue}
            >
              {field.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="input"
              onChange={(event) => updateArg(field.name, event.target.value)}
              value={toolArgs[field.name] ?? field.defaultValue}
            />
          )}
        </Field>
      ))}
    </div>
  );
}
