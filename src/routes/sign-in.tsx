import { createFileRoute } from "@tanstack/react-router";
import { PublicSignInEntry } from "@/components/sign-in-sheet";

export const Route = createFileRoute("/sign-in")({ component: PublicSignInEntry });
