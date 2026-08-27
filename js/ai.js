// Ask AI panel: posts the question to the backend (AI_ENDPOINT, from config.js),
// then evaluates the returned expression string itself with evaluate() from
// evaluator.js — the AI never computes the final number, so results stay exact.

document.querySelector('#aiButton').addEventListener('click', async () => {
  const questionInput = document.querySelector('#aiQuestion');
  const aiResultEl = document.querySelector('#aiResult');
  const aiButton = document.querySelector('#aiButton');
  const question = questionInput.value.trim();
  if (!question) { showToast('Enter a question first'); return; }

  aiButton.disabled = true;
  aiButton.textContent = 'Thinking...';
  aiResultEl.textContent = 'Asking the AI...';

  try {
    const response = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'The AI service failed.');
    if (!data.expression) throw new Error(data.explanation || 'Could not turn that into a math expression.');

    let value;
    try { value = evaluate(autoCloseParens(data.expression)); }
    catch { throw new Error('The AI returned an expression Ganiti could not evaluate: ' + data.expression); }

    aiResultEl.textContent = (data.explanation ? data.explanation + ' ' : '') + 'Expression: ' + data.expression + '  ->  Result: ' + formatNumber(value);
  } catch (error) {
    aiResultEl.textContent = 'Error';
    showToast(error.message);
  } finally {
    aiButton.disabled = false;
    aiButton.textContent = 'Ask';
  }
});
