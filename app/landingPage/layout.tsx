import type { Metadata } from "next";
import Nav from "@/app/components/landingPage/Nav";
import Footer from "@/app/components/landingPage/Footer";

export const metadata: Metadata = {
  title: "Logistiq",
  description: "Take control of your inventory. We'll take care of the guesswork.",
};

export default function LandingPageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Nav />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  );
}
