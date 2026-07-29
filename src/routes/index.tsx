import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import App from "@/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stride AI — Personalized Shoe Recommendations" },
      {
        name: "description",
        content:
          "Get personalized shoe recommendations based on your foot shape and activity with Stride AI.",
      },
      { property: "og:title", content: "Stride AI — Personalized Shoe Recommendations" },
      {
        property: "og:description",
        content:
          "Analyze your foot shape and discover the perfect shoes for your activity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <ClientOnly fallback={null}><App /></ClientOnly>;
}
