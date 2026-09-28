# ClosetClip

ClosetClip is a Chrome extension project for collecting clothing discoveries into a personal digital closet. This repository is being built in small milestones; the current milestone is the installable extension shell.

## Current status

- React, TypeScript, Vite, and Tailwind CSS are configured.
- A basic popup is available from the extension toolbar.
- A typed clothing item model defines the fields and categories for saved pieces.
- The popup's save control is intentionally disabled. Product detection and saving are later milestones.
- Product detection, saving, storage, closet management, and outfit features are not implemented yet.

## Tech stack

React · TypeScript · Tailwind CSS · Vite · Chrome Extension Manifest V3 · Lucide React

## Project structure

```text
public/
  icons/             Extension icons
  manifest.json      Manifest V3 definition
src/
  popup/             Popup React entry and UI
  types/             Shared TypeScript data models
  styles.css         Tailwind import and popup styles
tests/               Model and service tests
index.html           Vite popup document
vite.config.ts       React and Tailwind Vite plugins
```

## Local setup

Requirements: Node.js 22 or later and npm.

```bash
npm install
npm run dev
```

The Vite dev server is useful for working on the popup UI in a browser. Chrome extension APIs and extension behavior should be checked using the production build.

## Build and install in Chrome

```bash
npm run build
```

This creates the unpacked extension in `dist/`. To load it in Chrome:

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select the project's `dist` folder.
4. Click the ClosetClip toolbar icon to open the popup.

Reload the extension from `chrome://extensions` after rebuilding.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite's local development server |
| `npm run build` | Type-check and create the Chrome extension build |
| `npm run preview` | Preview the production web build locally |

There are no automated tests or lint script in this milestone. They will be introduced with the relevant features and tooling.

## Git workflow

`main` is reserved for stable releases. `develop` is the integration branch. Create `feature/<short-description>`, `fix/<short-description>`, or `docs/<short-description>` branches from `develop`; validate and commit each focused change before merging it back into `develop`. Promote `develop` to `main` after it is stable.

## Roadmap

1. Project and extension setup (current)
2. Clothing data model
3. Local storage service
4. Product metadata detection
5. Save clothing flow
6. My Closet interface
7. Outfit model and builder
8. Outfits dashboard
9. Progressive tests and CI

AI outfit suggestions, price tracking, cloud sync, accounts, and advanced clothing recognition remain future enhancements.
