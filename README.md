# Ganiti

Ganiti is a lightweight scientific calculator that runs entirely in the browser. It has a focused interface, light and dark themes, keyboard support, and no build step or backend.

## Features

- Basic arithmetic with parentheses, percentages, modulo, powers, and factorials
- Scientific functions: `sin`, `cos`, `tan`, inverse trigonometric functions, `log`, `ln`, `sqrt`, `cbrt`, `abs`, and reciprocal
- Degree and radian angle modes
- Memory controls: `MC`, `MR`, `M+`, and `M-`
- Undo, redo, and copy-result controls
- Light and dark themes saved in the browser
- Responsive layout for desktop and mobile screens

## Keyboard Controls

The laptop keyboard can be used for numbers and common operators. The on-screen keypad is still available for scientific functions and memory controls.

| Key | Action |
| --- | --- |
| `0-9`, `+`, `-`, `*`, `/`, `.`, `%`, `^`, `(`, `)` | Enter values and operators |
| `Enter` or `=` | Calculate |
| `Backspace` | Delete the last character |
| `Escape` | Clear the calculation |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Y` | Redo |

## Run Locally

No dependencies are required. Open `index.html` directly in a browser, or serve the folder with any static web server.

For example, with Python installed:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deployment

Ganiti is a static website. Deploy the project folder to any static hosting service such as GitHub Pages, Netlify, Vercel, or Cloudflare Pages. The main files are:

- `index.html` for the page structure
- `style.css` for layout and themes
- `script.js` for calculator behavior
