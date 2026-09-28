# ClosetClip

ClosetClip is a Chrome extension for saving clothing discoveries into a personal digital closet and arranging saved pieces into outfits. The current MVP stores data locally in Chrome; it has no account or backend.

## Features

- Detect product name, brand, price, currency, image, and page URL from JSON-LD, Open Graph metadata, and common page fallbacks.
- Save a detected product from the extension popup or the page context menu.
- Store clothing items locally and detect duplicates by source URL.
- Browse the closet, search by name, brand, or notes, filter by category, edit item details, open the original product, and delete saved items.
- Select closet items, create named outfits, and view, edit, or delete saved outfits.
- Keep outfits linked to clothing item IDs rather than copying the clothing records.

Product detection returns partial details where possible. ClosetClip does not claim that an arbitrary detected product is clothing; items are initially categorized as `unknown` for the user to edit.

## Tech stack

React · TypeScript · Tailwind CSS · Vite · Chrome Extension Manifest V3 · Chrome Storage · Lucide React · Vitest · React Testing Library

## Architecture

- `src/popup/` contains the React popup and navigation between Save, My Closet, and Outfits.
- `src/content/` extracts page metadata and responds to popup or context-menu requests.
- `src/background/` registers the context-menu action and forwards save requests to the active page.
- `src/services/` contains product extraction, product-to-item mapping, and Chrome Storage operations.
- `src/types/` defines clothing and outfit data models.
- `src/components/` contains the outfit builder and saved outfits dashboard.
- `tests/` covers extraction, storage, popup interactions, closet actions, and outfit workflows.

## Local setup

Requirements: Node.js 20.19+ or 22.12+ and npm (Vite 8 requirements).

```bash
npm ci
npm run dev
```

The Vite development server is for iterating on the popup UI. Extension APIs such as storage and page injection require loading the production build in Chrome.

## Build and install in Chrome

```bash
npm run build
```

The build type-checks the TypeScript, builds the popup, then separately bundles the content script and service worker as standalone scripts in `dist/`.

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select this project's `dist` folder.
4. Open a shopping page and click the ClosetClip toolbar icon to inspect and save a detected item.
5. Alternatively, right-click the page and choose **Save to ClosetClip**.

The extension uses `activeTab` and `scripting` to inspect a page only after the user invokes ClosetClip. Reload the extension in `chrome://extensions` after rebuilding.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite's popup development server |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Vitest and React Testing Library suites |
| `npm run build` | Type-check and build the unpacked extension into `dist/` |
| `npm run preview` | Preview the popup build locally |

## Continuous integration

GitHub Actions runs on pushes and pull requests. It uses `npm ci`, lint, tests, and the production build. The workflow is in `.github/workflows/ci.yml`.

## Git workflow

`main` is reserved for stable releases. `develop` is the integration branch. Create `feature/<short-description>`, `fix/<short-description>`, or `docs/<short-description>` branches from `develop`. Keep commits focused, validate changes, then merge completed features back into `develop`. Promote `develop` to `main` when the integration version is stable.

## Roadmap

- AI outfit suggestions
- Price tracking and price-drop notifications
- User accounts and cloud synchronization
- Advanced image-based clothing recognition
