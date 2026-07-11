import type { Metadata } from "next";
import { MosaicApp } from "./MosaicApp";

export const metadata: Metadata = {
  title: "Mosaic — Project memory for Product Managers",
  description: "Luci prepares meetings, synthesizes decisions, and keeps complex initiatives moving.",
};

export default function Home() {
  return <MosaicApp />;
}
