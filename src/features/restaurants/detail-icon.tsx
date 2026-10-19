import Image from "next/image";

const dimensions = {
  back: 24,
  previous: 20,
  arrow: 20,
  shield: 24,
  star: 24,
  locate: 16,
  external: 20,
  "external-white": 20,
  bookmark: 20,
  video: 32,
  search: 32,
} as const;

export function DetailIcon({ name }: { name: keyof typeof dimensions }) {
  return (
    <Image
      src={`/figma/detail/${name}.svg`}
      width={dimensions[name]}
      height={dimensions[name]}
      alt=""
      aria-hidden="true"
    />
  );
}
