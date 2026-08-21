const expressionEl = document.querySelector('#expression');
const resultEl = document.querySelector('#result');
const memoryStatusEl = document.querySelector('#memoryStatus');
const angleStatusEl = document.querySelector('#angleStatus');
const toastEl = document.querySelector('#toast');
const themeToggleEl = document.querySelector('#themeToggle');
const historyListEl = document.querySelector('#historyList');
const historySearchEl = document.querySelector('#historySearch');
const variableValueEl = document.querySelector('#variableValue');

let expression = '';
let result = 0;
let memory = 0;
let angleMode = 'DEG';
let history = [];
let historyIndex = -1;
let justCalculated = false;
let calculationHistory = JSON.parse(localStorage.getItem('ganiti-calculation-history') || '[]');
let variables = JSON.parse(localStorage.getItem('ganiti-variables') || '{"x": 0, "y": 0}');

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

const functions = { sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, log: Math.log10, ln: Math.log, sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs };
const constants = { pi: Math.PI, e: Math.E, ans: 0 };

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
function formatNumber(value) {
  if (!Number.isFinite(value)) return 'Error';
  if (Math.abs(value) < 1e-12) value = 0;
  return Number(value.toPrecision(12)).toString();
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
function factorial(value) {
  if (value < 0 || !Number.isInteger(value) || value > 170) throw new Error('Invalid factorial');
  let answer = 1;
  for (let index = 2; index <= value; index++) answer *= index;
  return answer;
}

function tokenize(input) {
  const tokens = [];
  let index = 0;
  while (index < input.length) {
    const rest = input.slice(index);
    const number = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
    const name = rest.match(/^[a-zA-Zπ]+/);
    if (/^\s/.test(rest)) { index++; continue; }
    if (number) { tokens.push({ type: 'number', value: Number(number[0]) }); index += number[0].length; continue; }
    if (name) { tokens.push({ type: 'name', value: name[0].toLowerCase().replace('π', 'pi') }); index += name[0].length; continue; }
    if ('+-×÷*/^%!()'.includes(input[index])) { tokens.push({ type: 'operator', value: input[index] }); index++; continue; }
    throw new Error('Unknown character');
  }
  return tokens;
}
const CONSTANT_NAMES = new Set(Object.keys(constants));
function withImplicitMultiplication(tokens) {
  const output = [];
  for (const token of tokens) {
    const previous = output[output.length - 1];
    if (previous) {
      const previousEndsValue = previous.type === 'number'
        || (previous.type === 'name' && CONSTANT_NAMES.has(previous.value))
        || (previous.type === 'operator' && (previous.value === ')' || previous.value === '!' || previous.value === '%'));
      const currentStartsValue = token.type === 'number'
        || (token.type === 'name' && token.value !== 'mod')
        || (token.type === 'operator' && token.value === '(');
      if (previousEndsValue && currentStartsValue) output.push({ type: 'operator', value: '*' });
    }
    output.push(token);
  }
  return output;
}
function evaluate(input) {
  const tokens = withImplicitMultiplication(tokenize(input.replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/')));
  let position = 0;
  const peek = () => tokens[position];
  const take = () => tokens[position++];
  function primary() {
    const token = take();
    if (!token) throw new Error('Incomplete expression');
    if (token.type === 'number') return token.value;
    if (token.type === 'name') {
      if (constants[token.value] !== undefined) return constants[token.value];
      if (variables[token.value] !== undefined) return variables[token.value];
      if (token.value === 'mod') throw new Error('mod needs a number on each side');
      if (!functions[token.value] || peek()?.value !== '(') throw new Error('Unknown function');
      take(); const value = expressionParser();
      if (take()?.value !== ')') throw new Error('Missing )');
      const radians = ['sin', 'cos', 'tan'].includes(token.value) ? (angleMode === 'DEG' ? value * Math.PI / 180 : value) : value;
      let answer = functions[token.value](radians);
      if (['asin', 'acos', 'atan'].includes(token.value) && angleMode === 'DEG') answer *= 180 / Math.PI;
      return answer;
    }
    if (token.value === '(') { const value = expressionParser(); if (take()?.value !== ')') throw new Error('Missing )'); return value; }
    if (token.value === '+' || token.value === '-') return token.value === '-' ? -primary() : primary();
    throw new Error('Expected a number');
  }
  function power() { let value = primary(); if (peek()?.value === '^') { take(); value = value ** power(); } return value; }
  function postfix() { let value = power(); while (peek()?.value === '!' || peek()?.value === '%') { const op = take().value; value = op === '!' ? factorial(value) : value / 100; } return value; }
  function term() { let value = postfix(); while (peek() && ['*', '/', '×', '÷', 'mod'].includes(peek().value)) { const op = take().value; const next = postfix(); value = op === '*' || op === '×' ? value * next : op === 'mod' ? value % next : value / next; } return value; }
  function expressionParser() { let value = term(); while (peek() && ['+', '-', '−'].includes(peek().value)) { const op = take().value; const next = term(); value = op === '+' ? value + next : value - next; } return value; }
  const answer = expressionParser();
  if (position < tokens.length) throw new Error('Check your expression');
  return answer;
}
function autoCloseParens(input) {
  let openCount = 0;
  for (const char of input) {
    if (char === '(') openCount++;
    else if (char === ')') openCount--;
  }
  return openCount > 0 ? input + ')'.repeat(openCount) : input;
}
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

document.querySelector('.tool-tabs').addEventListener('click', (event) => {
  const tab = event.target.closest('.tool-tab');
  if (!tab) return;
  document.querySelectorAll('.tool-tab').forEach((item) => item.classList.toggle('active', item === tab));
  document.querySelectorAll('.tool-panel').forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === tab.dataset.tool));
});
function convertValue(value, from, to) {
  if (from === to) return value;
  const length = { m: 1, km: 1000, mi: 1609.344, ft: 0.3048 };
  if (length[from] && length[to]) return value * length[from] / length[to];
  if (from === 'c' && to === 'f') return value * 9 / 5 + 32;
  if (from === 'f' && to === 'c') return (value - 32) * 5 / 9;
  throw new Error('Choose compatible units');
}
document.querySelector('#convertButton').addEventListener('click', () => {
  try { document.querySelector('#convertResult').textContent = formatNumber(convertValue(Number(document.querySelector('#convertValue').value), document.querySelector('#convertFrom').value, document.querySelector('#convertTo').value)); }
  catch (error) { document.querySelector('#convertResult').textContent = error.message; }
});
document.querySelector('#financeButton').addEventListener('click', () => {
  const principal = Number(document.querySelector('#financePrincipal').value), rate = Number(document.querySelector('#financeRate').value), years = Number(document.querySelector('#financeYears').value);
  document.querySelector('#financeResult').textContent = principal > 0 && years >= 0 ? `Future value: ${formatNumber(principal * (1 + rate / 100) ** years)} | Interest: ${formatNumber(principal * ((1 + rate / 100) ** years - 1))}` : 'Enter a principal and duration.';
});
document.querySelector('#equationButton').addEventListener('click', () => {
  const a = Number(document.querySelector('#equationA').value), b = Number(document.querySelector('#equationB').value), c = Number(document.querySelector('#equationC').value);
  document.querySelector('#equationResult').textContent = a ? `x = ${formatNumber((c - b) / a)}` : 'a cannot be zero for a linear equation.';
});
document.querySelector('#statsButton').addEventListener('click', () => {
  const values = document.querySelector('#dataValues').value.split(',').map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!values.length) { document.querySelector('#statsResult').textContent = 'Enter comma-separated numbers.'; return; }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length, middle = Math.floor(values.length / 2), median = values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
  document.querySelector('#statsResult').textContent = `Count: ${values.length} | Mean: ${formatNumber(mean)} | Median: ${formatNumber(median)} | Min: ${values[0]} | Max: ${values.at(-1)}`;
});
document.querySelector('#matrixButton').addEventListener('click', () => {
  const rows = document.querySelector('#matrixValues').value.split(';').map((row) => row.trim().split(/\s+/).map(Number));
  document.querySelector('#matrixResult').textContent = rows.length === 2 && rows.every((row) => row.length === 2 && row.every(Number.isFinite)) ? `Determinant: ${rows[0][0] * rows[1][1] - rows[0][1] * rows[1][0]}` : 'Enter a 2 x 2 matrix, for example: 1 2; 3 4';
});
document.querySelector('#programmerButton').addEventListener('click', () => {
  const value = Number(document.querySelector('#programmerValue').value);
  document.querySelector('#programmerResult').textContent = Number.isInteger(value) ? `BIN: ${value.toString(2)} | OCT: ${value.toString(8)} | HEX: ${value.toString(16).toUpperCase()}` : 'Enter a whole number.';
});
document.querySelector('#graphButton').addEventListener('click', () => {
  const canvas = document.querySelector('#graphCanvas'), context = canvas.getContext('2d'), expressionInput = document.querySelector('#graphFunction').value;
  context.clearRect(0, 0, canvas.width, canvas.height); context.strokeStyle = '#55c7b5'; context.beginPath();
  for (let pixel = 0; pixel <= canvas.width; pixel++) { const x = (pixel - canvas.width / 2) / 30; let y; try { y = evaluate(expressionInput.replace(/\bx\b/g, `(${x})`)); } catch { return; } const screenY = canvas.height / 2 - y * 30; if (pixel === 0) context.moveTo(pixel, screenY); else context.lineTo(pixel, screenY); }
  context.stroke(); context.strokeStyle = 'rgba(246,241,232,.3)'; context.beginPath(); context.moveTo(0, canvas.height / 2); context.lineTo(canvas.width, canvas.height / 2); context.moveTo(canvas.width / 2, 0); context.lineTo(canvas.width / 2, canvas.height); context.stroke();
});
