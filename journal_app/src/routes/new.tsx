import { createFileRoute } from "@tanstack/react-router";
import EntryEditor from "@/components/EntryEditor";

export const Route = createFileRoute("/new")({
  head: () => ({ meta: [{ title: "New Entry — Journal" }] }),
  component: () => <EntryEditor />,
});
