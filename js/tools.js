// Tool tabs: Convert, Finance, Equation, Data, Matrix, Programmer, Graph.
// Each panel is independent and does not share state with the core calculator,
// except Graph, which reuses evaluate()/formatNumber() from evaluator.js.

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
