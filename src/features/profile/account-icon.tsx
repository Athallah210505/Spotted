import Image from "next/image";

export function AccountIcon({
  name,
}: {
  name:
    | "profile-chevron"
    | "profile-pin"
    | "profile-shield"
    | "profile-user"
    | "bookmark-white"
    | "preview-arrow";
}) {
  return (
    <Image
      src={`/figma/account/${name}.svg`}
      width={20}
      height={20}
      alt=""
      aria-hidden="true"
    />
  );
}
