import { notFound } from "next/navigation";
import { ProgresoDashboard } from "../../components/progreso/ProgresoDashboard";

export const metadata = {
  title: "Progreso de documentación (interno)",
  robots: {
    index: false,
    follow: false,
  },
};

const isEnabled =
  process.env.NODE_ENV !== "production" ||
  process.env.ENABLE_PROGRESS_DASHBOARD === "true";

export default function ProgresoPage() {
  if (!isEnabled) {
    notFound();
  }

  return <ProgresoDashboard />;
}
