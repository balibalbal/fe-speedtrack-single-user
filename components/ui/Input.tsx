"use client"

import { InputHTMLAttributes } from "react"
import clsx from "clsx"

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none",
        className
      )}
      {...props}
    />
  )
}
