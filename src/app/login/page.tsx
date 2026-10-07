import type { Metadata } from "next";

import { Wordmark } from "@/components/layout/app-bar";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-start justify-center px-4 py-12 sm:items-center sm:py-16">
      <div className="w-full max-w-[400px]">
        <Wordmark className="mb-8 text-lg" />
        <LoginForm />
      </div>
    </main>
  );
}
