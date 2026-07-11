import { redirect } from "next/navigation";
import { SEED_INITIATIVE_ID } from "@/lib/mosaic-data";

export default function InitiativesRedirect() {
  redirect(`/initiatives/${SEED_INITIATIVE_ID}`);
}
