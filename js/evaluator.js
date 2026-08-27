// Core math engine: tokenizer, parser/evaluator, and number formatting.
// No DOM access here — this file only depends on `angleMode` and `variables`,
// which are declared in calculator.js and must be loaded after this file
// only for top-level (load-time) calls; evaluate() itself is fine either way
// since it only reads them when actually invoked.

const functions = { sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, log: Math.log10, ln: Math.log, sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs };
const constants = { pi: Math.PI, e: Math.E, ans: 0 };

function formatNumber(value) {
  if (!Number.isFinite(value)) return 'Error';
  if (Math.abs(value) < 1e-12) value = 0;
  return Number(value.toPrecision(12)).toString();
}

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
