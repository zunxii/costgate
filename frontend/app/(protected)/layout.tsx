import { requireServerUser } from "@/lib/server-auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireServerUser();
  return children;
}
