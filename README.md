# Atrium — Interior Studio

A browser-based 3D bedroom design studio. Walk the room, place and transform furniture, change materials and lighting, and save layouts locally.

## Run

```bash
npm install
npm run dev
```

Open the printed local URL. The dev server binds `0.0.0.0:5173`.

## Controls

- **Orbit** — drag to look, scroll to zoom
- **Walk** — WASD + drag to look (touch joystick on mobile)
- **W / E / R** — move, rotate, scale
- **Double-click** — use doors, windows, lamps, fan, wardrobe, computer, clock, books
- **Ctrl+Z / Ctrl+Y** — undo / redo
- **Ctrl+S** — save
- **1–6** — camera modes, including blueprint

Saves live in `localStorage`. No backend required.
