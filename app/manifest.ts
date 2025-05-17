import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TON WAR",
    short_name: "TON WAR",
    description: "Globally Chat",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "any",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "any",
        type: "image/x-png",
      },
    ],
  };
}
