# Productivity Guard

A browser extension for setting limits on distracting websites and making focused time easier to protect.

## What it does

- Defines social and distracting sites that should be limited
- Lets users review and adjust their focus rules
- Keeps the interface lightweight and local to the browser

## Development

```bash
pnpm install
pnpm dev
```

Build the extension with:

```bash
pnpm build
```

The production bundle is generated in the Vite output directory. Load it as an unpacked extension in your browser while developing.

## Status

Experimental project. Browser-store packaging, permissions, and automated coverage are still being refined.

## Stack

React · TypeScript · Vite · Tailwind CSS · WebExtension APIs
