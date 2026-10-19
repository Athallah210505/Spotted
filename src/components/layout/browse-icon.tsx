import Image from "next/image";

const extras = {
  pin: 20,
  bookmark: 20,
  "list-blue": 20,
  "list-white": 20,
  "map-blue": 20,
  "map-white": 20,
  locate: 24,
  plus: 20,
  close: 20,
} as const;

export function BrowseIcon({
  name,
  source = "explore",
  size = 24,
}: {
  name: string;
  source?: "explore" | "maps";
  size?: number;
}) {
  const dimension =
    source === "maps" ? extras[name as keyof typeof extras] : size;
  return (
    <Image
      src={
        source === "maps"
          ? `/figma/maps/${name}.svg`
          : `/figma/explore/icon-${name}.svg`
      }
      alt=""
      aria-hidden="true"
      width={dimension}
      height={dimension}
    />
  );
}
