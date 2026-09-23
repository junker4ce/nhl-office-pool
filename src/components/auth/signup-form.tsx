"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  async function readLogo(file: File | undefined) {
    setLogoError(null);

    if (!file) {
      return "";
    }

    if (!file.type.startsWith("image/") || !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      setLogoError("Choose a PNG, JPG, WEBP, or GIF image.");
      return null;
    }

    if (file.size > 512 * 1024) {
      setLogoError("Logo must be smaller than 512 KB.");
      return null;
    }

    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Unable to read logo."));
      reader.readAsDataURL(file);
    });
  }

  async function onSubmit(formData: FormData) {
    setError(null);
    setIsSubmitting(true);

    const payload = {
      displayName: String(formData.get("displayName") ?? "").trim(),
      teamName: String(formData.get("teamName") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim().toLowerCase(),
      password: String(formData.get("password") ?? ""),
    };

    const teamLogoData = await readLogo(formData.get("teamLogo") as File | undefined).catch(() => null);
    if (teamLogoData === null) {
      setIsSubmitting(false);
      return;
    }

    const signupRes = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...payload, teamLogoData }),
    });

    if (!signupRes.ok) {
      const data = (await signupRes.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Unable to create account.");
      setIsSubmitting(false);
      return;
    }

    const loginResult = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (!loginResult || loginResult.error) {
      setError("Account created, but automatic sign in failed.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="border-cyan-300/20 bg-slate-900/90">
      <CardHeader>
        <CardTitle className="font-heading text-4xl uppercase text-cyan-100">Create account</CardTitle>
        <CardDescription className="text-slate-300">
          Join your NHL office pool in under a minute.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input id="displayName" name="displayName" required minLength={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teamName">Team name</Label>
            <Input id="teamName" name="teamName" required minLength={2} maxLength={80} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teamLogo">Team logo</Label>
            <Input id="teamLogo" name="teamLogo" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
            <p className="text-xs text-slate-400">Optional. PNG, JPG, WEBP, or GIF up to 512 KB.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </div>
          {(error || logoError) && <p className="text-sm text-rose-300">{error ?? logoError}</p>}
          <Button type="submit" className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
