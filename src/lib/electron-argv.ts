/**
 * Extracts the `.vcf`/`.vcard` file paths from a raw `process.argv` array.
 *
 * Windows shells pass the executable path, any app flags, and the opened file
 * paths all as plain argv tokens. This helper keeps only the tokens that look
 * like vCard files (case-insensitive extension match) and skips the executable
 * path itself, so the Electron main process can read and import them.
 *
 * Paths containing spaces arrive as a single token and are preserved verbatim.
 *
 * @param argv - The full argument vector (e.g. `process.argv` or the
 *   `commandLine` from a `second-instance` event).
 * @param exePath - The current executable path (e.g. `process.execPath`),
 *   excluded so the app binary is never mistaken for a contact file.
 * @returns The vCard file paths in their original order, with no duplicates
 *   removed and no path normalization applied.
 */
export function pickVcfArgvEntries(argv: string[], exePath: string): string[] {
  const normalizedExePath = exePath.toLowerCase();

  return argv.filter((entry) => {
    if (entry.toLowerCase() === normalizedExePath) return false;
    return /\.(vcf|vcard)$/i.test(entry);
  });
}
