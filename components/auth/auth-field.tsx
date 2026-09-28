import type { InputHTMLAttributes } from "react";
import { inputClass } from "@/components/auth/button-styles";

type AuthFieldProps = {
  id: string;
  label: string;
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
  autoComplete?: string;
  value: string;
  onChange: (value: string) => void;
};

export function AuthField({
  id,
  label,
  type = "text",
  autoComplete,
  value,
  onChange,
}: AuthFieldProps) {
  return (
    <label className="block text-base font-medium text-foreground" htmlFor={id}>
      {label}
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} mt-2`}
        required
      />
    </label>
  );
}
