import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
  href?: string
}

export function Logo({ className, showText = true, size = "md", href = "/" }: LogoProps) {
  const sizes = {
    sm: { container: "h-10", logo: 40 }, // Increased from h-8 and 32
    md: { container: "h-12", logo: 48 }, // Increased from h-10 and 40
    lg: { container: "h-16", logo: 64 }, // Increased from h-12 and 48
  }

  const logoComponent = (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative", sizes[size].container, sizes[size].container)}>
        <Image
          src="/images/brave-logo.png"
          alt="BrAve Forms Logo"
          width={sizes[size].logo}
          height={sizes[size].logo}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span className={cn("font-bold", size === "lg" ? "text-2xl" : size === "md" ? "text-xl" : "text-lg")}>
          BrAve Forms
        </span>
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{logoComponent}</Link>
  }

  return logoComponent
}

