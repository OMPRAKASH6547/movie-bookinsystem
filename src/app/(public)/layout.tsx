import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="relative min-h-[70vh]">{children}</main>
      <Footer />
    </>
  );
}
