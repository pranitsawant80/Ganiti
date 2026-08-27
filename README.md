# Ganiti

Ganiti is a browser-based scientific calculator and math toolkit. It combines a fast expression calculator with reusable values, searchable history, graphing, conversions, finance, equations, data analysis, and programmer utilities. The core calculator and tools have no build step or backend. The optional **Ask AI** tab requires running a small local Python backend (see [Ask AI](#ask-ai-optional-backend) below).

## Features

### Scientific calculator 

- Arithmetic with parentheses, percentages, modulo, powers, and factorials
- `sin`, `cos`, `tan`, inverse trigonometric functions, `log`, `ln`, `sqrt`, `cbrt`, `abs`, and reciprocal
- Degree and radian modes
- Memory controls: `MC`, `MR`, `M+`, and `M-`
- Undo, redo, copy-result, and responsive keyboard input

### Reusable workspace

- Searchable calculation history with reload, delete, clear, and browser persistence
- `ANS`, `x`, and `y` values for repeated calculations
- Quick explanation of the completed expression and result
- Light and dark themes saved in the browser

### Built-in tools

Use the tabs below the calculator to access:

- **Convert:** metres, kilometres, miles, feet, Celsius, and Fahrenheit
- **Finance:** compound growth from principal, annual rate, and years
- **Equation:** solve linear equations in the form `ax + b = c`
- **Graph:** plot expressions using `x`, such as `x^2` or `sin(x)`
- **Data:** calculate count, mean, median, minimum, maximum, and a 2 x 2 matrix determinant
- **Programmer:** convert whole decimal numbers to binary, octal, and hexadecimal
- **Ask AI:** type a math question in plain English; an AI backend translates it into a Ganiti expression, which Ganiti then computes exactly (requires the optional local backend below)

## Keyboard Controls

The laptop keyboard can be used for numbers and common operators. The on-screen keypad remains available for scientific functions, variables, and memory controls.

| Key | Action |
| --- | --- |
| `0-9`, `+`, `-`, `*`, `/`, `.`, `%`, `^`, `(`, `)` | Enter values and operators |
| `Enter` or `=` | Calculate |
| `Backspace` | Delete the last character |
| `Escape` | Clear the calculation |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Y` | Redo |

Click `ANS`, `x`, or `y` to insert a reusable value. Enter a number in the value field and select `STO x` or `STO y` to save it.

## Storage

Ganiti stores theme choice, calculation history, and `x`/`y` values in `localStorage` on the current browser and device. No calculations are sent to a server.

The graph, converter, finance, equation, data, and programmer tools are intentionally lightweight browser utilities. They do not replace specialist numerical, accounting, or engineering software for high-precision work.

## Run Locally

No dependencies are required. Open `index.html` directly in a browser, or serve the folder with any static web server.

For example, with Python installed:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Ask AI (optional backend)

The Ask AI tab sends your question to a small local Flask server, which asks an NVIDIA-hosted model to translate it into a Ganiti expression (e.g. "15% of 200 plus the square root of 144" -> `200*15% + sqrt(144)`). The AI never computes the final number itself — Ganiti's own expression evaluator does, so results stay exact. Your API key never touches the browser.

1. Install dependencies:
   ```bash
   cd server
   pip install -r requirements.txt
   ```
2. Provide your NVIDIA API key, either by copying `server/.env.example` to `server/.env` and filling it in, or by exporting it directly:
   ```bash
   export NVIDIA_API_KEY=your-key-here
   ```
3. Start the backend:
   ```bash
   python app.py
   ```
   This runs on `http://localhost:5000`.
4. Serve or open `index.html` as usual. The Ask AI tab calls `http://localhost:5000/api/ask`.

Without the backend running, every other tab still works normally — only Ask AI shows an error toast.

## Deployment

Ganiti is a static website. Deploy the project folder to any static hosting service such as GitHub Pages, Netlify, Vercel, or Cloudflare Pages. The main files are:

- `index.html` for the page structure
- `style.css` for layout and themes
- `js/config.js`, `js/evaluator.js`, `js/calculator.js`, `js/tools.js`, `js/ai.js` for calculator behavior — set `AI_API_BASE` in `js/config.js` to your deployed API domain if the API is hosted separately from the static site
