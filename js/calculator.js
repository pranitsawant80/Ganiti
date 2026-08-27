// Core calculator: DOM refs, state, display/history/memory/keypad/theme.
// Depends on evaluate/formatNumber/autoCloseParens/constants from evaluator.js,
// so evaluator.js must be loaded first.

const expressionEl = document.querySelector('#expression');
const resultEl = document.querySelector('#result');
const memoryStatusEl = document.querySelector('#memoryStatus');
const angleStatusEl = document.querySelector('#angleStatus');
const toastEl = document.querySelector('#toast');
const themeToggleEl = document.querySelector('#themeToggle');
const historyListEl = document.querySelector('#historyList');
const historySearchEl = document.querySelector('#historySearch');
const variableValueEl = document.querySelector('#variableValue');
const keyHelpEl = document.querySelector('#keyHelp');

let expression = '';
let result = 0;
let memory = 0;
let angleMode = 'DEG';
let history = [];
let historyIndex = -1;
let justCalculated = false;
let calculationHistory = JSON.parse(localStorage.getItem('ganiti-calculation-history') || '[]');
let variables = JSON.parse(localStorage.getItem('ganiti-variables') || '{"x": 0, "y": 0}');

const keyHelp = {
  'sin(': 'Sine: use for angles in a right triangle or periodic wave calculations.',
  'cos(': 'Cosine: use for angles in a right triangle or periodic wave calculations.',
  'tan(': 'Tangent: use to find a side or angle from a right triangle.',
  'log(': 'Common logarithm (base 10): use for powers of 10, such as decibels or pH.',
  'ln(': 'Natural logarithm: use for continuous growth, decay, and exponential equations.',
  clear: 'All clear: remove the current expression and reset the displayed result.',
  backspace: 'Backspace: remove the last character from the current expression.',
  '%': 'Percent: divide the value before it by 100, such as 15%.',
  'asin(': 'Inverse sine: find an angle when you know a sine ratio.',
  'acos(': 'Inverse cosine: find an angle when you know a cosine ratio.',
  'atan(': 'Inverse tangent: find an angle when you know a tangent ratio.',
  'sqrt(': 'Square root: find the number that multiplies by itself to make the input.',
  'cbrt(': 'Cube root: find the number that multiplies by itself three times to make the input.',
    'abs(': 'Absolute value: remove a number\'s sign and keep its distance from zero.',
  '1/(': 'Reciprocal: calculate one divided by a value, such as 1/4.',
  '^': 'Power: raise a number to an exponent, such as 2^3.',
  mod: 'Remainder: find what is left after integer division, such as 17 mod 5.',
  'π': 'Pi: use for circle calculations, including circumference and area.',
  e: 'Euler\'s number: use in natural exponential growth and decay calculations.',
  '(': 'Opening parenthesis: group part of an expression and control its order.',
  ')': 'Closing parenthesis: finish a grouped expression or function input.',
  '÷': 'Division: split a value into equal parts or find a rate.',
  '!': 'Factorial: multiply a whole number by every positive whole number below it.',
  '×': 'Multiplication: scale values or calculate the area of repeated equal groups.',
  '−': 'Subtraction: find the difference between values or decrease a quantity.',
  '+': 'Addition: combine values or totals.',
  equals: 'Calculate: evaluate the expression and show the result.',
  '1/': 'Fraction shortcut: start a reciprocal expression by inserting 1/.',
  '.': 'Decimal point: enter a value with a fractional part, such as 3.14.'
};

function showKeyHelp(button) {
  const key = button.dataset.action || button.dataset.value;
  keyHelpEl.textContent = keyHelp[key] || 'Use this key as part of your calculation.';
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const isLight = theme === 'light';
  themeToggleEl.querySelector('.theme-icon').textContent = isLight ? '☾' : '☼';
  themeToggleEl.querySelector('.theme-label').textContent = isLight ? 'DARK' : 'LIGHT';
  themeToggleEl.title = `Switch to ${isLight ? 'dark' : 'light'} theme`;
  themeToggleEl.setAttribute('aria-label', themeToggleEl.title);
  document.querySelector('meta[name="theme-color"]').content = isLight ? '#eee9df' : '#171c1e';
  localStorage.setItem('ganiti-theme', theme);
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toastEl.classList.remove('show'), 1500);
}
function saveCalculationHistory() {
  localStorage.setItem('ganiti-calculation-history', JSON.stringify(calculationHistory));
}
function renderCalculationHistory() {
  const query = historySearchEl.value.trim().toLowerCase();
  const entries = calculationHistory.filter((entry) => `${entry.expression} ${entry.result}`.toLowerCase().includes(query));
  historyListEl.replaceChildren();
  if (!entries.length) {
    const empty = document.createElement('p');
    empty.className = 'history-empty';
    empty.textContent = query ? 'No matching calculations' : 'Your completed calculations will appear here';
    historyListEl.append(empty);
    return;
  }
  entries.forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.dataset.historyId = entry.id;
    item.innerHTML = '<button class="history-load" type="button"><span class="history-expression"></span><span class="history-result"></span></button><button class="history-delete" type="button" title="Delete calculation" aria-label="Delete calculation">×</button>';
    item.querySelector('.history-expression').textContent = entry.expression;
    item.querySelector('.history-result').textContent = entry.result;
    item.querySelector('.history-load').style.cssText = 'display:block;width:100%;padding:0;background:transparent;color:inherit;text-align:left;cursor:pointer';
    historyListEl.append(item);
  });
}
function updateDisplay() {
  expressionEl.textContent = expression || '0';
  resultEl.textContent = formatNumber(result);
  memoryStatusEl.textContent = `M ${memory ? formatNumber(memory) : '0'}`;
  angleStatusEl.textContent = angleMode;
  document.querySelector('#angleToggle').textContent = angleMode;
}
function pushHistory(state) {
  history = history.slice(0, historyIndex + 1);
  history.push(state);
  historyIndex++;
}
function restoreState(state) {
  expression = state.expression;
  result = state.result;
  justCalculated = false;
  updateDisplay();
}
function insert(value) {
  if (justCalculated && /[0-9πe.(]/.test(value)) expression = '';
  justCalculated = false;
  expression += value;
  updateDisplay();
}
function clearAll() { expression = ''; result = 0; justCalculated = false; updateDisplay(); }
function backspace() { expression = expression.slice(0, -1); justCalculated = false; updateDisplay(); }

function calculate() {
  if (!expression) return;
  try {
    const previousState = { expression, result };
    const completedExpression = autoCloseParens(expression);
    result = evaluate(completedExpression);
    constants.ans = result;
    document.querySelector('#steps').textContent = `Input: ${completedExpression}  ->  Result: ${formatNumber(result)}. Use parentheses to control operation order.`;
    calculationHistory.unshift({ id: Date.now(), expression: completedExpression, result: formatNumber(result) });
    calculationHistory = calculationHistory.slice(0, 50);
    saveCalculationHistory();
    renderCalculationHistory();
    pushHistory(previousState);
    pushHistory({ expression: formatNumber(result), result });
    expression = formatNumber(result);
    justCalculated = true;
    updateDisplay();
  }
  catch (error) { resultEl.textContent = 'Error'; showToast(error.message); }
}
function memoryAction(action) {
  if (action === 'memory-clear') memory = 0;
  if (action === 'memory-recall') insert(formatNumber(memory));
  if (action === 'memory-add') { memory += result; showToast('Added to memory'); }
  if (action === 'memory-subtract') { memory -= result; showToast('Subtracted from memory'); }
  updateDisplay();
}

document.querySelector('#keypad').addEventListener('click', (event) => {
  const button = event.target.closest('button'); if (!button) return;
  if (button.dataset.action === 'equals') calculate();
  else if (button.dataset.action === 'clear') clearAll();
  else if (button.dataset.action === 'backspace') backspace();
  else insert(button.dataset.value);
});
document.querySelector('#keypad').addEventListener('mouseover', (event) => {
  const button = event.target.closest('button');
  if (button && !/^[0-9]$/.test(button.textContent.trim())) showKeyHelp(button);
});
document.querySelector('#keypad').addEventListener('focusin', (event) => {
  const button = event.target.closest('button');
  if (button && !/^[0-9]$/.test(button.textContent.trim())) showKeyHelp(button);
});
document.querySelector('.utility-row').addEventListener('click', (event) => {
  const action = event.target.closest('button')?.dataset.action;
  if (action === 'undo' && historyIndex > 0) { historyIndex--; restoreState(history[historyIndex]); }
  if (action === 'redo' && historyIndex < history.length - 1) { historyIndex++; restoreState(history[historyIndex]); }
  if (action === 'copy') navigator.clipboard?.writeText(formatNumber(result)).then(() => showToast('Result copied'));
});
document.querySelector('.memory-row').addEventListener('click', (event) => memoryAction(event.target.closest('button')?.dataset.action));
historySearchEl.addEventListener('input', renderCalculationHistory);
document.querySelector('#clearHistory').addEventListener('click', () => {
  calculationHistory = [];
  saveCalculationHistory();
  renderCalculationHistory();
  showToast('History cleared');
});
historyListEl.addEventListener('click', (event) => {
  const item = event.target.closest('.history-item');
  if (!item) return;
  const entryIndex = calculationHistory.findIndex((entry) => String(entry.id) === item.dataset.historyId);
  if (event.target.closest('.history-delete')) {
    calculationHistory.splice(entryIndex, 1);
    saveCalculationHistory();
    renderCalculationHistory();
    return;
  }
  if (event.target.closest('.history-load')) {
    expression = calculationHistory[entryIndex].expression;
    result = evaluate(expression);
    justCalculated = false;
    updateDisplay();
  }
});
document.querySelector('.variables-row').addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.variable) {
    const value = Number(variableValueEl.value);
    if (!Number.isFinite(value)) { showToast('Enter a value first'); return; }
    variables[button.dataset.variable] = value;
    localStorage.setItem('ganiti-variables', JSON.stringify(variables));
    variableValueEl.value = '';
    showToast(`${button.dataset.variable} stored`);
  } else if (button.dataset.value) insert(button.dataset.value);
});
document.querySelector('#angleToggle').addEventListener('click', () => { angleMode = angleMode === 'DEG' ? 'RAD' : 'DEG'; updateDisplay(); });
themeToggleEl.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === '=') { event.preventDefault(); calculate(); }
  else if (event.key === 'Escape') clearAll();
  else if (event.key === 'Backspace') backspace();
  else if (event.key.toLowerCase() === 'z' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); document.querySelector('[data-action="undo"]').click(); }
  else if (event.key.toLowerCase() === 'y' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); document.querySelector('[data-action="redo"]').click(); }
  else if (/^[0-9+\-*/().%^!]$/.test(event.key)) insert(event.key);
});
setTheme(localStorage.getItem('ganiti-theme') || 'dark');
updateDisplay();
renderCalculationHistory();
