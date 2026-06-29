"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface PropDef {
  type?: string | string[];
  description?: string;
  enum?: string[];
}
interface JsonSchema {
  type?: string;
  properties?: Record<string, PropDef>;
  required?: string[];
}

function primaryType(t?: string | string[]) {
  if (Array.isArray(t)) return t.find((x) => x !== "null") ?? t[0];
  return t;
}

// A JSON field for array/object inputs: keeps the raw text locally (so partial JSON
// is typeable) and only propagates a parsed value when it's valid.
function JsonField({ initial, placeholder, onChange }: { initial: unknown; placeholder: string; onChange: (v: unknown) => void }) {
  const [raw, setRaw] = useState(initial === undefined ? "" : typeof initial === "string" ? initial : JSON.stringify(initial));
  const [err, setErr] = useState(false);
  return (
    <>
      <Textarea
        value={raw}
        rows={3}
        placeholder={placeholder}
        className={`font-mono text-xs ${err ? "border-signal" : ""}`}
        onChange={(e) => {
          const v = e.target.value;
          setRaw(v);
          if (!v.trim()) {
            setErr(false);
            onChange(undefined);
            return;
          }
          try {
            onChange(JSON.parse(v));
            setErr(false);
          } catch {
            setErr(true);
          }
        }}
      />
      {err ? <p className="mt-1 text-xs text-signal">Invalid JSON</p> : null}
    </>
  );
}

/**
 * Renders input fields from a tool's JSON Schema: string/number/integer/enum inline,
 * boolean as a checkbox, and array/object via a validated JSON field. A type badge
 * sits next to each label. Gateway signs — there is no wallet step here.
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
        const type = primaryType(def?.type) ?? "string";
        const enumVals = Array.isArray(def?.enum) ? def.enum : undefined;
        const isNumber = type === "number" || type === "integer";
        const isBool = type === "boolean";
        const isComplex = type === "array" || type === "object";
        return (
          <div key={key}>
            <label className="mb-1 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-3">
              <span>
                {key}
                {required.has(key) ? <span className="text-casper"> *</span> : null}
              </span>
              <span className="rounded-sm border border-hairline px-1 text-[9px] lowercase text-ink-3">{type}</span>
            </label>
            {isBool ? (
              <label className="flex items-center gap-2 text-sm text-ink-2">
                <input
                  type="checkbox"
                  checked={Boolean(values[key])}
                  onChange={(e) => set(key, e.target.checked)}
                  className="size-4 accent-[var(--color-casper)]"
                />
                {def?.description ?? "Enabled"}
              </label>
            ) : enumVals ? (
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
            ) : isComplex ? (
              <JsonField
                initial={values[key]}
                placeholder={type === "array" ? '["item1", "item2"]' : '{ "key": "value" }'}
                onChange={(v) => set(key, v)}
              />
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
