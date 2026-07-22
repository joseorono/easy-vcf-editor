"use client";

import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background py-4 text-center text-sm text-muted-foreground hidden lg:block">
      <p>
        Made with love by{" "}
        <a
          href="https://github.com/joseorono"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors"
        >
          José Oroño
        </a>
        .<span className="mx-2 text-muted-foreground">•</span>
        <a
          href="https://github.com/joseorono/easy-vcf-editor"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors"
        >
          <Github className="h-3.5 w-3.5" />
          View on GitHub
        </a>
      </p>
    </footer>
  );
}
