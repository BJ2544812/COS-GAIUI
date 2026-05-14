"use client"

import * as React from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface AppAvatarProps {
  src?: string | null
  name?: string | null
  className?: string
  size?: "default" | "sm" | "lg" | "xl" | "2xl"
}

export function AppAvatar({
  src,
  name,
  className,
  size = "default",
}: AppAvatarProps) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?"

  const sizeClasses = {
    sm: "size-6 text-[10px]",
    default: "size-8 text-xs",
    lg: "size-10 text-sm",
    xl: "size-16 text-xl",
    "2xl": "size-32 text-4xl md:size-40 md:text-5xl",
  }

  return (
    <Avatar 
      className={cn(
        "rounded-full border-2 border-white shadow-sm font-black uppercase tracking-tighter", 
        sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.default,
        className
      )}
    >
      {src ? (
        <AvatarImage src={src} alt={name || "Avatar"} className="object-cover" />
      ) : null}
      <AvatarFallback className="bg-slate-100 text-slate-400">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
