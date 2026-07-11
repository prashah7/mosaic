import Image from "next/image";
import { cn } from "@/lib/utils";

type MosaicLogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "hero";
  priority?: boolean;
};

const sizes = {
  sm: { width: 22, height: 17, className: "h-[17px] w-[22px]" },
  md: { width: 28, height: 21, className: "h-[21px] w-[28px]" },
  lg: { width: 40, height: 30, className: "h-[30px] w-[40px]" },
  hero: { width: 120, height: 92, className: "h-[72px] w-[94px] sm:h-[92px] sm:w-[120px]" },
};

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
