# Lumo – Design System & Motion Guidelines

This document defines the **visual language, motion principles, and UX constraints**
for Lumo. All UI/UX implementations must strictly follow these rules.

Lumo is a **premium, calm, intelligent product**.
The experience should feel similar to Apple products:
minimal, confident, elegant, and distraction-free.

---

## 1. Design Philosophy

**Core Principles**
- Calm and focused
- Intelligent and encouraging
- Premium, not playful
- Minimal, not empty
- Motion supports understanding, not attention-seeking

**What Lumo is NOT**
- Not a game
- Not flashy
- Not colorful or noisy
- Not “fun” in a childish sense

Lumo should feel like a **high-end IDE meets a thoughtful mentor**.

---

## 2. Color System

### Base Theme
- Default: Dark Mode
- Optional Light Mode (later)

### Core Colors
- Background: #0F1115 / #111827
- Surface panels: #151823
- Text primary: #E5E7EB
- Text secondary: #9CA3AF

### Accent Color (choose ONE)
- Calm Blue: #4F83FF
- OR Soft Purple: #7C6FFF
- OR Deep Green: #3BA676

> Accent color should be used sparingly:
> buttons, focus states, progress indicators.

### Status Colors
- Success: muted green (#22C55E but softened)
- Warning: amber, not yellow
- Error: deep red, not bright

---

## 3. Typography

### UI Font
- Primary: Inter / Geist / SF-like sans-serif
- Large headings preferred
- Generous line-height

### Code Font
- JetBrains Mono / Fira Code
- Syntax highlighting should be subtle

### Rules
- Prefer fewer words
- Short sentences
- Clear hierarchy

---

## 4. Layout & Spacing

- Heavy use of whitespace
- Clear separation between sections
- Avoid dense layouts
- Content should “breathe”

**Golden rule:**
If the UI feels slightly too empty — it’s probably right.

---

## 5. Motion & Animation Principles

### Motion Philosophy
Motion must:
- Explain transitions
- Indicate state change
- Provide feedback

Motion must NOT:
- Distract
- Entertain
- Surprise unnecessarily

---

### Allowed Motion Types

#### 1. Micro-interactions (Required)
- Button hover (background + subtle scale)
- Focus states
- Loading indicators

#### 2. State Transitions
- Exercise → Feedback
- Hint hidden → Hint revealed
- Module locked → Unlocked

#### 3. Progressive Reveal
- Mentor hints appear gradually
- Feedback sections fade in
- Code output revealed step-by-step

---

### Motion Timing
- Duration: 200–400ms
- Easing: ease-out / cubic-bezier
- Translation: 8–24px max
- Scale: 1 → 1.02 max

---

### Forbidden Animations
- Bounce
- Spin
- Shake
- Confetti
- Flashing effects
- Long looping animations

If it looks fun for a 10-year-old, it does not belong in Lumo.

---

## 6. AI Interaction UX

### Thinking State
- Calm text: “Mentor is thinking…”
- Subtle animated cursor or skeleton
- No jumping dots

### Response Display
- Text appears smoothly
- Sections separated clearly
- No sudden content dumps

---

## 7. Page-Specific Guidelines

### Landing Page
- Apple-like scroll storytelling
- Use GSAP + ScrollTrigger
- Large typography
- Minimal copy
- Motion tied to scroll

### Learning Page
- Monaco editor as the center
- Exercise instructions on one side
- Mentor feedback on the other
- Framer Motion only (no scroll animations)

### Dashboard
- Clean cards
- Simple progress indicators
- Minimal charts
- Focus on clarity

---

## 8. Accessibility & Comfort

- Avoid visual overload
- Avoid excessive contrast
- Support reduced motion preferences
- No aggressive animations

---

## 9. Implementation Stack

Recommended:
- Next.js
- Tailwind CSS
- shadcn/ui
- Framer Motion
- GSAP (Landing only)
- Lenis (smooth scrolling)

---

## 10. Final Rule

If motion or design does not clearly improve:
- understanding
- flow
- confidence

It should not be included.

Lumo values **clarity over cleverness**.