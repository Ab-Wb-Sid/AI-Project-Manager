import type { Metadata } from "next";
import { Newsreader, Schibsted_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const sans = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-schibsted",
  display: "swap",
});

const serif = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NovaWorks",
    template: "%s · NovaWorks",
  },
  description: "Turn meeting transcripts into projects, tasks, owners, and deadlines.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full`}>
      <body className="min-h-full bg-paper font-sans text-base text-ink">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: "!font-sans !rounded-control !border-line !text-sm !text-ink",
          }}
        />
      </body>
    </html>
  );
}
