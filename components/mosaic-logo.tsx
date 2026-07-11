import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoSize = "xs" | "sm" | "md" | "lg" | "hero";

const sizes: Record<
  LogoSize,
  { width: number; height: number; className: string }
> = {
  xs: { width: 18, height: 14, className: "h-3.5 w-[18px]" },
  sm: { width: 22, height: 17, className: "h-[17px] w-[22px]" },
  md: { width: 28, height: 21, className: "h-[21px] w-[28px]" },
  lg: { width: 40, height: 30, className: "h-[30px] w-10" },
  hero: {
    width: 120,
    height: 92,
    className: "h-[72px] w-[94px] sm:h-[92px] sm:w-[120px]",
  },
};

type MosaicLogoProps = {
  className?: string;
  size?: LogoSize;
  priority?: boolean;
};

/** Fuzzy M mark — use everywhere the brand icon appears. */
export const MosaicLogo = ({
  className,
  size = "md",
  priority = false,
}: MosaicLogoProps) => {
  const dims = sizes[size];
  return (
    <Image
      src="/mosaic-logo.jpg"
      alt="Mosaic"
      width={dims.width}
      height={dims.height}
      priority={priority}
      className={cn(
        "object-contain object-center select-none",
        dims.className,
        className,
      )}
    />
  );
};

type MosaicBrandProps = {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
  showLuci?: boolean;
  priority?: boolean;
  onClick?: () => void;
};

const brandSize = {
  sm: {
    logo: "sm" as const,
    word: "text-[13px] font-medium tracking-[-0.01em]",
    luci: "text-[9px] tracking-[0.14em]",
    gap: "gap-2",
  },
  md: {
    logo: "md" as const,
    word: "text-[18px] font-semibold tracking-[-0.03em]",
    luci: "text-[10px] tracking-[0.16em]",
    gap: "gap-2.5",
  },
  lg: {
    logo: "lg" as const,
    word: "text-[22px] font-semibold tracking-[-0.03em]",
    luci: "text-[10px] tracking-[0.16em]",
    gap: "gap-3",
  },
};

/** Logo + Mosaic wordmark for nav / auth headers. */
export const MosaicBrand = ({
  className,
  href = "/",
  size = "md",
  showLuci = false,
  priority = false,
  onClick,
}: MosaicBrandProps) => {
  const s = brandSize[size];
  const content = (
    <>
      <MosaicLogo size={s.logo} priority={priority} />
      <span className={cn(s.word, "text-foreground")}>
        Mosaic
        {showLuci ? (
          <span
            className={cn(
              "ml-2 align-middle font-medium uppercase text-accent",
              s.luci,
            )}
          >
            Luci
          </span>
        ) : null}
      </span>
    </>
  );

  const sharedClass = cn(
    "inline-flex items-center rounded-md transition hover:opacity-90 focus-ring",
    s.gap,
    className,
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={sharedClass}>
        {content}
      </Link>
    );
  }

  return (
    <div className={sharedClass} onClick={onClick}>
      {content}
    </div>
  );
};

type LuciAvatarProps = {
  className?: string;
  size?: "sm" | "md";
};

const avatarBox = {
  sm: "size-7",
  md: "size-9",
};

/** Circular Mosaic mark used as Luci’s face in chat. */
export const LuciAvatar = ({ className, size = "sm" }: LuciAvatarProps) => (
  <div
    className={cn(
      "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-black",
      avatarBox[size],
      className,
    )}
  >
    <MosaicLogo size={size === "md" ? "sm" : "xs"} />
  </div>
);
