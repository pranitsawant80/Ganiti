const expressionEl = document.querySelector('#expression');
const resultEl = document.querySelector('#result');
const memoryStatusEl = document.querySelector('#memoryStatus');
const angleStatusEl = document.querySelector('#angleStatus');
const toastEl = document.querySelector('#toast');

let expression = '';
let result = 0;
let memory = 0;
let angleMode = 'DEG';
let history = [];
let historyIndex = -1;
let justCalculated = false;

const functions = { sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, log: Math.log10, ln: Math.log, sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs };
const constants = { pi: Math.PI, e: Math.E };

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toastEl.classList.remove('show'), 1500);
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
function saveState() {
  history = history.slice(0, historyIndex + 1);
  history.push({ expression, result });
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
function evaluate(input) {
  const tokens = tokenize(input.replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/'));
  let position = 0;
  const peek = () => tokens[position];
  const take = () => tokens[position++];
  function primary() {
    const token = take();
    if (!token) throw new Error('Incomplete expression');
    if (token.type === 'number') return token.value;
    if (token.type === 'name') {
      if (constants[token.value] !== undefined) return constants[token.value];
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
function calculate() {
  if (!expression) return;
  try {
    const previousState = { expression, result };
    result = evaluate(expression);
    history = history.slice(0, historyIndex + 1);
    history.push(previousState, { expression: formatNumber(result), result });
    historyIndex += 2;
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
document.querySelector('#angleToggle').addEventListener('click', () => { angleMode = angleMode === 'DEG' ? 'RAD' : 'DEG'; updateDisplay(); });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === '=') { event.preventDefault(); calculate(); }
  else if (event.key === 'Escape') clearAll();
  else if (event.key === 'Backspace') backspace();
  else if (event.key.toLowerCase() === 'z' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); document.querySelector('[data-action="undo"]').click(); }
  else if (event.key.toLowerCase() === 'y' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); document.querySelector('[data-action="redo"]').click(); }
  else if (/^[0-9+\-*/().%^!]$/.test(event.key)) insert(event.key);
});
updateDisplay();
