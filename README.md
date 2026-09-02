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

## Running and deploying

The same files at the repo root run both locally and in the cloud — `js/config.js`
picks the Ask AI API URL by hostname. Two guides:

- **[docs/running-locally.md](docs/running-locally.md)** — open `index.html` or
  `python -m http.server`, plus the optional local Flask backend for Ask AI.
- **[docs/deploying-to-cloud.md](docs/deploying-to-cloud.md)** — static site to
  GitHub Pages / Netlify / S3, and the Ask AI API to AWS Lambda (root
  `Dockerfile`) or another container host, including the `AI_API_BASE` and CORS
  changes you must make.

The core calculator and every tool except Ask AI need no backend. Without the
backend running, only Ask AI shows an error toast.

### How Ask AI works

The Ask AI tab sends your question to a small Flask server, which asks an
NVIDIA-hosted model to translate it into a Ganiti expression (e.g. "15% of 200
plus the square root of 144" -> `200*15% + sqrt(144)`). The AI never computes the
final number itself — Ganiti's own expression evaluator does, so results stay
exact. Your API key never touches the browser.
