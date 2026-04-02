
// set today's date
const dateEl = document.getElementById('todayDate');
dateEl.textContent = new Date().toLocaleDateString('en-IN', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
const tickerFacts = [
  "🌡️ The last decade was the hottest on record",
  "🌊 Sea levels are rising ~3.7mm per year globally",
  "🌲 18 million acres of forest are lost every year",
  "☀️ Solar power costs have dropped 90% in a decade",
  "🚗 Transport accounts for 16% of global emissions",
  "🥩 Meat and dairy cause 14.5% of global emissions",
  "💡 Switching to LEDs cuts lighting energy use by 75%",
  "🏠 Buildings are responsible for ~40% of energy use worldwide",
  "🔋 Electric vehicles emit 50–70% less CO₂ over their lifetime",
  "🌾 Eating plant-based one day per week saves ~530kg CO₂/year",
];

const tickerEl = document.getElementById('tickerInner');

// render twice so the CSS animation can loop without a gap
[...tickerFacts, ...tickerFacts].forEach(fact => {
  const item = document.createElement('span');
  item.className = 'ticker-item';
  item.innerHTML = `<span class="ticker-dot">◆</span>${fact}`;
  tickerEl.appendChild(item);
});

let chartInstance = null;

// A pastel palette that matches the site's colour scheme
const chartPalette = [
  '#ddd4f5', '#f5d4d4', '#d4f0e0', '#f5ead4',
  '#c4b8ed', '#edaeb8', '#a9e8b8', '#edcc8c',
  '#b8a9e8', '#e8b8b8'
];


// -------------------------------------------------------
// Main function
// -------------------------------------------------------

async function analyseDay() {
  const apiKey = document.getElementById('apiKey').value.trim();
  const userText = document.getElementById('dayInput').value.trim();
  const btn = document.getElementById('analyseBtn');

  // hide any previous error
  hideError();

  // basic validation before we hit the API
  if (!apiKey) {
    showError('Please enter your Anthropic API key at the top.');
    return;
  }
  if (userText.length < 20) {
    showError('Please describe your day in a bit more detail.');
    return;
  }

  // UI: show loading state
  btn.classList.add('loading');
  btn.innerHTML = 'Analysing... <span class="btn-arrow">⏳</span>';
  document.getElementById('loadingSection').style.display = 'block';
  document.getElementById('resultsSection').style.display = 'none';
  document.getElementById('resultsSection').classList.remove('visible');

  // what we tell the model to do
  const systemPrompt = `You are a carbon footprint analyst. The user will describe their day in plain English.

Your job:
1. Parse every activity mentioned (food, travel, home appliances, digital usage, shopping, etc.)
2. If quantities are vague or not stated, infer reasonable typical amounts
3. Calculate CO2 emissions for each activity using standard IPCC/IEA emission factors relevant to India
4. Return ONLY a raw JSON object — no markdown, no code fences, no explanation, no preamble, no sign-off

The JSON must follow this exact structure:
{
  "activities": [
    { "name": "string describing activity", "co2_kg": number }
  ],
  "total_co2_kg": number,
  "top_category": "string",
  "home_tips": [
    { "title": "short title", "body": "1-2 sentence tip", "icon": "single emoji" },
    { "title": "short title", "body": "1-2 sentence tip", "icon": "single emoji" },
    { "title": "short title", "body": "1-2 sentence tip", "icon": "single emoji" }
  ],
  "area_tips": [
    { "title": "short title", "body": "1-2 sentence tip", "icon": "single emoji" },
    { "title": "short title", "body": "1-2 sentence tip", "icon": "single emoji" },
    { "title": "short title", "body": "1-2 sentence tip", "icon": "single emoji" }
  ]
}

Rules:
- Respond with ONLY the JSON object, nothing else
- co2_kg values must be plain numbers, not strings
- Home tips must be specifically based on what the user actually did today
- Area tips should be practical local community actions relevant to India
- Do not mention any AI, model, tool, or assistant in the output`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userText }]
      })
    });

    if (!response.ok) {
      // try to pull out the API's error message if there is one
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();

    // join all text blocks (there's usually just one but just in case)
    const rawText = data.content
      .map(block => block.type === 'text' ? block.text : '')
      .join('')
      .trim();

    // strip any accidental markdown fences the model might sneak in
    const cleanText = rawText.replace(/```json|```/g, '').trim();

    const parsed = JSON.parse(cleanText);
    renderResults(parsed);

  } catch (err) {
    showError('Something went wrong: ' + err.message);
  } finally {
    // always restore the button, hide loader
    btn.classList.remove('loading');
    btn.innerHTML = 'Analyse My Day <span class="btn-arrow">→</span>';
    document.getElementById('loadingSection').style.display = 'none';
  }
}


// -------------------------------------------------------
// Render — takes the parsed JSON and populates the UI
// -------------------------------------------------------

function renderResults(data) {
  const total = parseFloat(data.total_co2_kg) || 0;

  // big number at the top
  document.getElementById('totalNumber').textContent = total.toFixed(1);

  // colour-coded verdict badge
  const badge = document.getElementById('verdictBadge');
  badge.className = 'verdict-badge'; // reset classes first

  if (total < 5) {
    badge.classList.add('verdict-green');
    badge.textContent = '✓ Low Impact Day';
  } else if (total <= 15) {
    badge.classList.add('verdict-amber');
    badge.textContent = '⚡ Moderate Impact';
  } else {
    badge.classList.add('verdict-red');
    badge.textContent = '▲ High Impact Day';
  }

  // fun equivalences — keeps it relatable
  const kmEquivalent = Math.round(total / 0.21);
  const burgersEquivalent = (total / 2.5).toFixed(1);
  document.getElementById('comparisonLine').textContent =
    `That's roughly equivalent to driving ${kmEquivalent} km, or eating ${burgersEquivalent} beef burgers.`;

  // donut chart
  const activities = data.activities || [];
  const labels = activities.map(a => a.name);
  const values = activities.map(a => parseFloat(a.co2_kg) || 0);

  if (chartInstance) chartInstance.destroy(); // clean up old chart first

  const ctx = document.getElementById('donutChart').getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: chartPalette.slice(0, values.length),
        borderColor: '#0d0d0d',
        borderWidth: 2,
        hoverOffset: 6
      }]
    },
    options: {
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { family: "'DM Mono', monospace", size: 10 },
            padding: 12,
            boxWidth: 12
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.toFixed(2)} kg CO₂`
          }
        }
      }
    }
  });

  // activity breakdown cards
  const breakdownGrid = document.getElementById('breakdownGrid');
  breakdownGrid.innerHTML = '';

  activities.forEach(activity => {
    const item = document.createElement('div');
    item.className = 'breakdown-item';
    item.innerHTML = `
      <span class="bi-name">${activity.name}</span>
      <div>
        <span class="bi-val">${parseFloat(activity.co2_kg).toFixed(2)}</span>
        <span class="bi-unit">kg CO₂</span>
      </div>`;
    breakdownGrid.appendChild(item);
  });

  // home tips
  renderTips(data.home_tips, 'homeTips', 'home-tip');

  // area / community tips
  renderTips(data.area_tips, 'areaTips', 'area-tip');

  // finally show the results section with a smooth fade-in
  const resultsSection = document.getElementById('resultsSection');
  resultsSection.style.display = 'block';

  // double rAF trick to make the CSS transition actually fire
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      resultsSection.classList.add('visible');
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}


// -------------------------------------------------------
// Helper — renders a list of tip objects into a container
// -------------------------------------------------------

function renderTips(tips, containerId, cardClass) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  (tips || []).forEach(tip => {
    const card = document.createElement('div');
    card.className = `tip-card ${cardClass}`;
    card.innerHTML = `
      <span class="tip-icon">${tip.icon || '🌱'}</span>
      <h3 class="tip-title">${tip.title}</h3>
      <p class="tip-body">${tip.body}</p>`;
    container.appendChild(card);
  });
}


// -------------------------------------------------------
// Error helpers
// -------------------------------------------------------

function showError(msg) {
  const box = document.getElementById('errorBox');
  box.textContent = '⚠ ' + msg;
  box.style.display = 'block';
}

function hideError() {
  document.getElementById('errorBox').style.display = 'none';
}


// -------------------------------------------------------
// Keyboard shortcut — Ctrl+Enter to submit
// -------------------------------------------------------

document.getElementById('dayInput').addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'Enter') analyseDay();
});
