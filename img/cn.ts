@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

@theme {
  --color-accent: #FFD400;
  --color-accent-hover: #FFC107;
  --color-accent-dim: #B8960A;
  --color-surface-dark: #0A0A0A;
  --color-surface-card: #141414;
  --color-surface-card-hover: #1C1C1C;
  --color-surface-elevated: #1A1A1A;
  --color-surface-border: #2A2A2A;
  --color-surface-light: #f7f7f7;
  --color-surface-light-alt: #fbfbfb;
  --color-surface-light-card: #FFFFFF;
  --color-surface-light-elevated: #F0F0F0;
  --color-surface-light-border: #E0E0E0;
  --color-text-light-primary: #1f1f1f;
  --color-text-light-secondary: #555555;
  --color-text-light-muted: #888888;
  --color-brand-black: #0A0A0A;
  --color-brand-white: #FFFFFF;
  --color-green-whatsapp: #25D366;
  --color-green-whatsapp-hover: #1EBE5A;
  --font-heading: 'Montserrat', sans-serif;
  --font-body: 'Inter', sans-serif;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  scroll-padding-top: 72px;
}

body {
  font-family: var(--font-body);
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.dark body,
body:is(.dark *) {
  background-color: var(--color-surface-dark);
  color: var(--color-brand-white);
}

body {
  background-color: var(--color-surface-light);
  color: var(--color-text-light-primary);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #141414;
}
::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--color-accent);
}

/* Animations */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 212, 0, 0.45); }
  50% { box-shadow: 0 0 0 14px rgba(255, 212, 0, 0); }
}

@keyframes float-up {
  0% { transform: translateY(30px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes float-in-left {
  0% { transform: translateX(-40px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

@keyframes float-in-right {
  0% { transform: translateX(40px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes bounce-subtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes modal-in {
  0% { opacity: 0; transform: translateY(30px) scale(0.97); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes modal-out {
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(30px) scale(0.97); }
}

@keyframes sheet-in {
  0% { transform: translateY(100%); }
  100% { transform: translateY(0); }
}

@keyframes sheet-out {
  0% { transform: translateY(0); }
  100% { transform: translateY(100%); }
}

@keyframes overlay-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes spinner {
  to { transform: rotate(360deg); }
}

.animate-pulse-glow {
  animation: pulse-glow 2s infinite;
}

.animate-float-up {
  animation: float-up 0.7s ease-out forwards;
}

.animate-float-left {
  animation: float-in-left 0.7s ease-out forwards;
}

.animate-float-right {
  animation: float-in-right 0.7s ease-out forwards;
}

.animate-glow {
  animation: glow-pulse 3s ease-in-out infinite;
}

.animate-spin-slow {
  animation: spin-slow 20s linear infinite;
}

.animate-bounce-subtle {
  animation: bounce-subtle 2s ease-in-out infinite;
}

.animate-modal-in {
  animation: modal-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-sheet-in {
  animation: sheet-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-overlay-in {
  animation: overlay-in 0.25s ease-out forwards;
}

.animate-spinner {
  animation: spinner 0.7s linear infinite;
}

/* Glass effect */
.glass {
  background: rgba(20, 20, 20, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.glass-light {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

/* Gradient text */
.text-gradient {
  background: linear-gradient(135deg, var(--color-accent) 0%, #FFF176 50%, var(--color-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Card glow on hover */
.card-glow {
  position: relative;
  overflow: hidden;
}

.card-glow::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 212, 0, 0.06) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.card-glow:hover::before {
  opacity: 1;
}

/* Section transition */
.section-transition {
  transition: background-color 0.3s ease;
}

/* Safe area for mobile floating bar */
.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* Logo image fit */
.logo-img {
  object-fit: contain;
  max-height: 100%;
  max-width: 100%;
}

/* Focus styles */
*:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Selection */
::selection {
  background-color: var(--color-accent);
  color: var(--color-brand-black);
}

/* Micro-interaction transitions */
.micro-hover {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.micro-hover:hover {
  transform: translateY(-2px);
}
.micro-hover:active {
  transform: translateY(0);
}

/* Light mode subtle texture */
.light-texture {
  background-image: radial-gradient(circle at 50% 50%, rgba(0,0,0,0.015) 0%, transparent 80%);
}

/* Modal body lock */
body.modal-open {
  overflow: hidden;
  touch-action: none;
}
