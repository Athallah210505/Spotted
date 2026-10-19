"use client";

import { createContext, useContext, useState } from "react";

export type PreviewProfile = {
  name: string;
  city: "jakarta" | "tangsel";
  radius: 1 | 3 | 5 | 10;
};
const defaults: PreviewProfile = {
  name: "Athallah",
  city: "jakarta",
  radius: 5,
};
const ProfileContext = createContext<{
  profile: PreviewProfile;
  updateProfile: (values: Partial<PreviewProfile>) => void;
} | null>(null);

export function PreviewProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState(defaults);
  return (
    <ProfileContext
      value={{
        profile,
        updateProfile: (values) =>
          setProfile((current) => ({ ...current, ...values })),
      }}
    >
      {children}
    </ProfileContext>
  );
}

export function usePreviewProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("PreviewProfileProvider is required");
  return context;
}
