# Prompts Used

## Chatbot: Claude

## Prompt 1 (Final)

---

# Role

You are a senior frontend developer specialized in building accessible, modern web applications with vanilla JavaScript and Tailwind CSS.

# Objective

Modify the provided seed files (`index.html` and `script.js`) to create a fully functional **Stopwatch and Countdown Timer** single-page web application. Also create a `styles.css` file for any custom styles not covered by Tailwind utilities.

# Seed Files

## index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Timer and Countdown</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>
<h1>Timer and Countdown</h1>
<script src="script.js"></script>
</body>
</html>
```

## script.js

(empty)

# Design Reference

The UI should follow this design language (inspired by online-stopwatch.com):

- A large, prominent time display showing `HH:MM:SS` with smaller milliseconds (`.000`) inside a rounded container with a light background
- A green **Start** button and a red **Clear/Reset** button, both large and rounded
- Clean, minimal, centered layout

# Functional Requirements

## 1. Mode Switching

- Two tabs or toggle buttons at the top: **Stopwatch** and **Countdown**
- Switching modes resets the current timer
- The active mode tab should be visually highlighted

## 2. Stopwatch Mode (Count Up)

- Display format: `HH:MM:SS.mmm` (hours, minutes, seconds, milliseconds)
- **Start** button: begins counting up; changes label to **Pause** while running
- **Pause** button: pauses the timer; changes label back to **Resume**
- **Resume** button: continues from where it paused
- **Reset** button: stops the timer and resets display to `00:00:00.000`
- **Lap** button (visible only while running or paused with time > 0): records the current time as a lap split
- Lap times are displayed in a scrollable list below the timer, showing lap number, lap split time, and cumulative time
- Milliseconds update smoothly using `requestAnimationFrame`

## 3. Countdown Mode (Count Down)

- Input fields for **hours**, **minutes**, and **seconds** (numeric spinners or input fields, max: 99h 59m 59s)
- Display format: `HH:MM:SS` (no milliseconds needed for countdown)
- **Start** button: begins counting down; hides the input fields and shows the countdown display; changes label to **Pause**
- **Pause/Resume**: same behavior as stopwatch
- **Reset** button: stops countdown and returns to the input view
- **When countdown reaches 00:00:00**:
  - The display flashes red (CSS animation, alternating between red and the default color)
  - An audio alert plays (use the Web Audio API to generate a beep tone — no external audio files)
  - A "Time's up!" message appears
  - A **Dismiss** button stops the alert and flashing

## 4. Quick Presets (Countdown only)

- Show 3-4 quick preset buttons below the input fields: e.g., "1 min", "5 min", "10 min", "15 min"
- Clicking a preset fills in the input and optionally auto-starts

# Technical Requirements

## Tailwind CSS

- Load Tailwind CSS via CDN (`<script src="https://cdn.tailwindcss.com"></script>`)
- Use Tailwind utility classes for ALL layout, spacing, typography, colors, borders, shadows, and responsive design
- Use a modern dark theme: dark background (`bg-gray-900`), light text, vibrant accent colors for buttons (green-500 for start, red-500 for reset, blue-500 for active tab)
- The `styles.css` file should only contain custom animations (e.g., the flash animation for countdown alert) and font imports if needed
- Use a monospace font for the time display (e.g., `font-mono` or import a font like "JetBrains Mono" or "Space Mono")

## Responsive Design

- Mobile-first approach
- The timer should be usable and look good on screens from 320px to 1920px wide
- Stack buttons vertically on very small screens, horizontally on larger ones

## Accessibility (WCAG 2.1 AA)

- All interactive elements must be keyboard accessible (Tab navigation, Enter/Space to activate)
- Use semantic HTML elements (`<button>`, `<input>`, `<nav>`, `<section>`, `<time>`)
- Add `aria-label` attributes to all buttons and inputs
- Add `aria-live="polite"` region for the timer display so screen readers announce time updates (throttled to every few seconds, not every millisecond)
- Add `role="tablist"`, `role="tab"`, and `role="tabpanel"` for the mode switcher
- Visible focus indicators on all interactive elements (use Tailwind's `focus:ring` utilities)
- Color contrast ratio of at least 4.5:1 for all text
- Add `aria-pressed` state for the Start/Pause toggle button
- The countdown alert beep must be dismissible (not trap the user)

## Code Quality

- Clean, well-organized vanilla JavaScript (no frameworks)
- Use ES6+ features (const/let, arrow functions, template literals, destructuring)
- Separate concerns: DOM manipulation, timer logic, and audio generation should be in clearly distinct sections or modules within `script.js`
- Use `requestAnimationFrame` for smooth stopwatch display updates
- Use `setInterval` (1-second intervals) for countdown updates
- Avoid global variable pollution — use an IIFE or module pattern

# Output Format

Provide the complete code for exactly 3 files:

1. **`index.html`** — Full HTML file with Tailwind CDN, semantic structure, and ARIA attributes
2. **`script.js`** — Complete JavaScript with all timer logic, DOM manipulation, and Web Audio API for the alert beep
3. **`styles.css`** — Minimal CSS for custom animations and any styles not achievable with Tailwind utilities

For each file, provide the full contents (not diffs or partial snippets). Do not include any explanatory text between the code blocks — just the three complete files clearly labeled.
