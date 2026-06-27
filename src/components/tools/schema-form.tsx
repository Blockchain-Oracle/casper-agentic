"use client";

import { Input } from "@/components/ui/input";

interface JsonSchema {
  type?: string;
  properties?: Record<string, { type?: string; description?: string; enum?: string[] }>;
  required?: string[];
}

/**
 * Renders input fields from a tool's JSON Schema. Handles the flat object shapes
 * MCP tools use (string / number / integer / enum). For anything richer it shows a
 * raw JSON editor. (Swap in @rjsf if tools start shipping deeply nested schemas.)
 */
export function SchemaForm({
  schema,
  values,
  onChange,
}: {
  schema: unknown;
  values: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const s = (schema ?? {}) as JsonSchema;
  const props = s.properties && typeof s.properties === "object" ? s.properties : null;

  if (!props || Object.keys(props).length === 0) {
    return <p className="text-sm text-ink-3">This tool takes no inputs.</p>;
  }

  const required = new Set(s.required ?? []);
  const set = (key: string, value: unknown) => onChange({ ...values, [key]: value });

  return (
    <div className="space-y-3">
      {Object.entries(props).map(([key, def]) => {
        const isNumber = def?.type === "number" || def?.type === "integer";
        const enumVals = Array.isArray(def?.enum) ? def.enum : undefined;
        return (
          <div key={key}>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-3">
              {key}
              {required.has(key) ? <span className="text-casper"> *</span> : null}
            </label>
            {enumVals ? (
              <select
                value={String(values[key] ?? "")}
                onChange={(e) => set(key, e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-panel px-3 text-sm text-ink"
              >
                <option value="" disabled>
                  Select…
                </option>
                {enumVals.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                type={isNumber ? "number" : "text"}
                value={String(values[key] ?? "")}
                onChange={(e) => set(key, e.target.value)}
                placeholder={def?.description ?? ""}
                inputMode={isNumber ? "decimal" : undefined}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
