'use client';
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t mt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 flex items-center justify-center gap-3 text-sm text-neutral-600">
        <span>GoodHeart is a project by</span>
        <Link href="https://goodish.org" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:opacity-90">
          <Image src="/goodish-logo.png" alt="Goodish" width={20} height={20} />
          <span className="font-medium text-neutral-900">Goodish</span>
        </Link>
      </div>
    </footer>
  );
}
