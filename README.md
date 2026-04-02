# 🌍 CO₂ Daily Activity Tracker

A magazine-style web app that calculates your daily carbon footprint from a plain English description of your day.

## How it works
Type what you did today — what you ate, how you travelled, what you used at home — and the app breaks down your CO₂ emissions activity by activity, gives you a colour-coded verdict, a donut chart, and personalised tips to reduce your impact.

## Features
- Natural language input — no forms, just describe your day
- AI-powered CO₂ calculations using IPCC/IEA emission factors for India
- Activity breakdown with donut chart (Chart.js)
- Colour-coded verdict: Low / Moderate / High impact
- Personalised at-home tips based on your actual day
- Local community action tips
- API key saved to browser — paste once, never again
- Fully mobile responsive
- Editorial/magazine design aesthetic

## Tech Stack
- HTML, CSS, JavaScript (vanilla)
- Anthropic Claude API (`claude-sonnet-4-20250514`)
- Chart.js
- Google Fonts (Playfair Display, DM Mono, Libre Baskerville)
- Hosted on GitHub Pages

## Setup
1. Get an Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
2. Open the site and paste your key in the bar at the top
3. Describe your day and hit **Analyse My Day**
