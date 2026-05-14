"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            toast:
              "!rounded-2xl !backdrop-blur-xl !border !border-white/40 dark:!border-white/10 !shadow-lg",
            title: "!text-sm",
          },
        }}
      />
    </ThemeProvider>
  );
}
