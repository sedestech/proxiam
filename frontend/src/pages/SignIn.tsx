import { SignIn as ClerkSignIn } from "@clerk/clerk-react";
import { Zap } from "lucide-react";

export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md space-y-8 px-4">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500">
            <Zap className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Proxiam
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              OS Energie Renouvelable
            </p>
          </div>
        </div>

        {/* Clerk Sign-In */}
        <div className="flex justify-center">
          <ClerkSignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border border-slate-200 dark:border-slate-700",
              },
            }}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
          />
        </div>
      </div>
    </div>
  );
}
