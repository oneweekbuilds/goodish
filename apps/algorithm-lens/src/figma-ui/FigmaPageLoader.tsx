import React, { useEffect, useState, type ComponentType } from "react";
import "./globals.scoped.css";

export function FigmaPageLoader({ name }: { name: string }) {
  const [Comp, setComp] = useState<ComponentType | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import(`./export/${name}.tsx`);
        if (mounted) setComp(() => (mod as any)[name] || (mod as any).default);
      } catch {
        if (mounted) setComp(null);
      }
    })();
    return () => { mounted = false; };
  }, [name]);

  if (!Comp) {
    return (
      <div className="alg-fm">
        <main className="mx-auto max-w-5xl px-6 py-16 text-center">
          <h1 className="text-3xl font-semibold">Coming soon</h1>
          <p className="mt-2 text-gray-600">This page will render as soon as the Figma code is injected.</p>
        </main>
      </div>
    );
  }
  return (
    <div className="alg-fm">
      <Comp />
    </div>
  );
}










