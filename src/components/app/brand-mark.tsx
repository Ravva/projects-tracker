import Image from "next/image";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/weekly-control-logo.svg"
      alt="Projects Tracker"
      className={className}
      width={44}
      height={44}
    />
  );
}
