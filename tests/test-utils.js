(function testUtilities(global) {
  const results = [];
  const suiteStack = [];

  function fullName(name) {
    return suiteStack.length ? `${suiteStack.join(' > ')} > ${name}` : name;
  }

  function describe(name, callback) {
    suiteStack.push(name);
    try {
      callback();
    } finally {
      suiteStack.pop();
    }
  }

  function test(name, callback) {
    const label = fullName(name);

    try {
      callback();
      results.push({ name: label, passed: true });
    } catch (error) {
      results.push({
        name: label,
        passed: false,
        message: error.message,
        stack: error.stack
      });
    }
  }

  function format(value) {
    return typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
  }

  function deepEqual(actual, expected) {
    return JSON.stringify(actual) === JSON.stringify(expected);
  }

  function expect(actual) {
    return {
      toBe(expected) {
        if (actual !== expected) {
          throw new Error(`Esperado ${format(expected)}, recebido ${format(actual)}`);
        }
      },
      toEqual(expected) {
        if (!deepEqual(actual, expected)) {
          throw new Error(`Esperado ${format(expected)}, recebido ${format(actual)}`);
        }
      },
      toBeGreaterThan(expected) {
        if (!(actual > expected)) {
          throw new Error(`Esperado valor maior que ${format(expected)}, recebido ${format(actual)}`);
        }
      },
      toBeLessThan(expected) {
        if (!(actual < expected)) {
          throw new Error(`Esperado valor menor que ${format(expected)}, recebido ${format(actual)}`);
        }
      },
      toBeTruthy() {
        if (!actual) {
          throw new Error(`Esperado valor verdadeiro, recebido ${format(actual)}`);
        }
      },
      toBeFalsy() {
        if (actual) {
          throw new Error(`Esperado valor falso, recebido ${format(actual)}`);
        }
      }
    };
  }

  function getSummary() {
    const passed = results.filter((result) => result.passed).length;
    const failed = results.length - passed;

    return {
      total: results.length,
      passed,
      failed
    };
  }

  function render(summaryElement, resultsElement) {
    const summary = getSummary();
    summaryElement.innerHTML = `
      Total: <strong>${summary.total}</strong> |
      Aprovados: <strong class="status-pass">${summary.passed}</strong> |
      Falhados: <strong class="status-fail">${summary.failed}</strong>
    `;

    resultsElement.innerHTML = results.map((result) => `
      <article class="test ${result.passed ? 'pass' : 'fail'}">
        <strong class="${result.passed ? 'status-pass' : 'status-fail'}">
          ${result.passed ? 'PASS' : 'FAIL'}
        </strong>
        ${result.name}
        ${result.passed ? '' : `<pre>${result.message}</pre>`}
      </article>
    `).join('');
  }

  global.describe = describe;
  global.test = test;
  global.expect = expect;
  global.TestRunner = {
    results,
    getSummary,
    render
  };
})(globalThis);
