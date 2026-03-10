"use client";

import type { HTMLAttributes } from "react";
import { useState } from "react";

import { Input } from "@/components/ui/input";

function getCounterClassName(length: number, maxLength: number) {
  if (length >= maxLength * 0.9) {
    return "text-amber-600 dark:text-amber-400";
  }

  return "text-muted-foreground";
}

interface InputWithCounterProps {
  id?: string;
  name: string;
  maxLength: number;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  type?: string;
  required?: boolean;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}

export function InputWithCounter({
  id,
  name,
  maxLength,
  defaultValue = "",
  placeholder,
  className,
  type = "text",
  required,
  inputMode,
}: InputWithCounterProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="space-y-2">
      <Input
        id={id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        className={className}
        maxLength={maxLength}
        required={required}
        inputMode={inputMode}
        onChange={(event) => setValue(event.target.value)}
      />
      <p
        className={`text-right text-xs ${getCounterClassName(
          value.length,
          maxLength,
        )}`}
      >
        {value.length}/{maxLength}
      </p>
    </div>
  );
}

interface TextareaWithCounterProps {
  id?: string;
  name: string;
  maxLength: number;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export function TextareaWithCounter({
  id,
  name,
  maxLength,
  defaultValue = "",
  placeholder,
  className,
  required,
}: TextareaWithCounterProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="space-y-2">
      <textarea
        id={id}
        name={name}
        value={value}
        required={required}
        placeholder={placeholder}
        className={className}
        maxLength={maxLength}
        onChange={(event) => setValue(event.target.value)}
      />
      <p
        className={`text-right text-xs ${getCounterClassName(
          value.length,
          maxLength,
        )}`}
      >
        {value.length}/{maxLength}
      </p>
    </div>
  );
}
