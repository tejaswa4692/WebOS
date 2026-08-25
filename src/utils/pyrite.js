// Pyrite Programming Language Interpreter
// Extension: .pyt
// An elegant Python-like syntax interpreter designed for WebOS.

let currentCanvasCtx = null;
export function setCanvasContext(ctx) {
  currentCanvasCtx = ctx;
}

class Scope {
  constructor(parent = null) {
    this.variables = {};
    this.parent = parent;
  }
  
  get(name) {
    if (name in this.variables) {
      return this.variables[name];
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    return undefined;
  }
  
  set(name, value) {
    let curr = this;
    while (curr) {
      if (name in curr.variables) {
        curr.variables[name] = value;
        return;
      }
      curr = curr.parent;
    }
    this.variables[name] = value;
  }
  
  getFullContext() {
    const ctx = this.parent ? this.parent.getFullContext() : {};
    return { ...ctx, ...this.variables };
  }
}

function preprocess(code) {
  const lines = code.split('\n');
  const processed = [];
  
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    
    // Strip comments '#' not inside quotes
    let inDoubleQuote = false;
    let inSingleQuote = false;
    let commentIndex = -1;
    
    for (let j = 0; j < rawLine.length; j++) {
      const char = rawLine[j];
      if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
      } else if (char === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
      } else if (char === '#' && !inDoubleQuote && !inSingleQuote) {
        commentIndex = j;
        break;
      }
    }
    
    let lineWithoutComment = commentIndex === -1 ? rawLine : rawLine.slice(0, commentIndex);
    
    // Find indentation
    const match = lineWithoutComment.match(/^([ \t]*)/);
    const indentStr = match ? match[0] : '';
    const indent = indentStr.replace(/\t/g, '    ').length;
    
    const trimmed = lineWithoutComment.trim();
    if (trimmed) {
      processed.push({
        lineIndex: i,
        indent,
        text: trimmed
      });
    }
  }
  return processed;
}

function parseStatement(line) {
  const text = line.text;
  const lineIndex = line.lineIndex;
  
  // 1. Function definition: fn name(args):
  const fnMatch = text.match(/^fn\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*:/);
  if (fnMatch) {
    const name = fnMatch[1];
    const args = fnMatch[2].split(',').map(s => s.trim()).filter(Boolean);
    return { type: 'fn', name, args, lineIndex };
  }
  
  // 2. If: if cond:
  const ifMatch = text.match(/^if\s+(.+)\s*:/);
  if (ifMatch) {
    return { type: 'if', condition: ifMatch[1].trim(), lineIndex };
  }
  
  // 3. Elif: elif cond:
  const elifMatch = text.match(/^elif\s+(.+)\s*:/);
  if (elifMatch) {
    return { type: 'elif', condition: elifMatch[1].trim(), lineIndex };
  }
  
  // 4. Else: else:
  const elseMatch = text.match(/^else\s*:/);
  if (elseMatch) {
    return { type: 'else', lineIndex };
  }
  
  // 5. While: while cond:
  const whileMatch = text.match(/^while\s+(.+)\s*:/);
  if (whileMatch) {
    return { type: 'while', condition: whileMatch[1].trim(), lineIndex };
  }
  
  // 6. For: for var in iterable:
  const forMatch = text.match(/^for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+(.+)\s*:/);
  if (forMatch) {
    return {
      type: 'for',
      varName: forMatch[1],
      iterable: forMatch[2].trim(),
      lineIndex
    };
  }
  
  // 7. Return: return expr
  if (text.startsWith('return ') || text === 'return') {
    const expr = text.slice(6).trim();
    return { type: 'return', expr: expr || 'undefined', lineIndex };
  }
  
  // 8. Break & Continue
  if (text === 'break') {
    return { type: 'break', lineIndex };
  }
  if (text === 'continue') {
    return { type: 'continue', lineIndex };
  }
  
  // 9. Assignment: lhs = rhs
  const eqIdx = text.indexOf('=');
  if (eqIdx !== -1) {
    const charBefore = text[eqIdx - 1];
    const charAfter = text[eqIdx + 1];
    const isComparison = ['=', '!', '<', '>', '+', '-', '*', '/'].includes(charBefore) || charAfter === '=';
    if (!isComparison) {
      const lhs = text.slice(0, eqIdx).trim();
      const rhs = text.slice(eqIdx + 1).trim();
      if (lhs) {
        return { type: 'assignment', lhs, rhs, lineIndex };
      }
    }
  }
  
  // 10. Plain Expression
  return { type: 'expression', expr: text, lineIndex };
}

function parseBlocks(lines, startIndex = 0, parentIndent = -1) {
  const statements = [];
  let i = startIndex;
  
  while (i < lines.length) {
    const line = lines[i];
    
    if (line.indent <= parentIndent) {
      break;
    }
    
    const stmt = parseStatement(line);
    
    if (['if', 'elif', 'else', 'while', 'for', 'fn'].includes(stmt.type)) {
      const sub = parseBlocks(lines, i + 1, line.indent);
      stmt.body = sub.statements;
      i = sub.nextIndex;
    } else {
      i++;
    }
    statements.push(stmt);
  }
  
  return { statements, nextIndex: i };
}

function groupIfBranches(statements) {
  const grouped = [];
  let currentIf = null;
  
  for (const stmt of statements) {
    if (stmt.body) {
      stmt.body = groupIfBranches(stmt.body);
    }
    
    if (stmt.type === 'if') {
      currentIf = stmt;
      currentIf.alternatives = [];
      grouped.push(stmt);
    } else if (stmt.type === 'elif' || stmt.type === 'else') {
      if (currentIf) {
        currentIf.alternatives.push(stmt);
      } else {
        throw new Error(`Syntax Error at line ${stmt.lineIndex + 1}: '${stmt.type}' without a matching 'if'`);
      }
    } else {
      currentIf = null;
      grouped.push(stmt);
    }
  }
  return grouped;
}

function isSimpleIdentifier(str) {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(str);
}

function translatePythonExprToJs(expr) {
  const parts = expr.split(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/);
  
  for (let i = 0; i < parts.length; i += 2) {
    let segment = parts[i];
    if (segment) {
      segment = segment.replace(/\band\b/g, '&&');
      segment = segment.replace(/\bor\b/g, '||');
      segment = segment.replace(/\bnot\b/g, '!');
      segment = segment.replace(/\bTrue\b/g, 'true');
      segment = segment.replace(/\bFalse\b/g, 'false');
      segment = segment.replace(/\bNone\b/g, 'null');
      segment = segment.replace(/\bis\b/g, '===');
      parts[i] = segment;
    }
  }
  return parts.join('');
}

function evalInContext(expr, context) {
  if (!expr || !expr.trim()) return undefined;
  
  const keys = Object.keys(context);
  const values = Object.values(context);
  
  try {
    const jsExpr = translatePythonExprToJs(expr);
    const fn = new Function(...keys, `return (${jsExpr});`);
    return fn(...values);
  } catch (err) {
    throw new Error(`Failed to evaluate "${expr}" (${err.message})`);
  }
}

function executeBlockSync(statements, scope, outputFn, inputFn) {
  for (const stmt of statements) {
    try {
      if (stmt.type === 'assignment') {
        const rhsVal = evalInContext(stmt.rhs, scope.getFullContext());
        if (isSimpleIdentifier(stmt.lhs)) {
          scope.set(stmt.lhs, rhsVal);
        } else {
          evalInContext(`${stmt.lhs} = ${stmt.rhs}`, scope.getFullContext());
        }
      } else if (stmt.type === 'expression') {
        evalInContext(stmt.expr, scope.getFullContext());
      } else if (stmt.type === 'if') {
        const cond = evalInContext(stmt.condition, scope.getFullContext());
        if (cond) {
          const subScope = new Scope(scope);
          const result = executeBlockSync(stmt.body, subScope, outputFn, inputFn);
          if (result) return result;
        } else {
          let branchExecuted = false;
          for (const branch of stmt.alternatives || []) {
            if (branch.type === 'elif') {
              const branchCond = evalInContext(branch.condition, scope.getFullContext());
              if (branchCond) {
                const subScope = new Scope(scope);
                const result = executeBlockSync(branch.body, subScope, outputFn, inputFn);
                if (result) return result;
                branchExecuted = true;
                break;
              }
            } else if (branch.type === 'else') {
              const subScope = new Scope(scope);
              const result = executeBlockSync(branch.body, subScope, outputFn, inputFn);
              if (result) return result;
              branchExecuted = true;
              break;
            }
          }
        }
      } else if (stmt.type === 'while') {
        let iterations = 0;
        const maxIterations = 5000;
        while (evalInContext(stmt.condition, scope.getFullContext())) {
          iterations++;
          if (iterations > maxIterations) {
            throw new Error(`Infinite loop threshold exceeded (${maxIterations} iterations)`);
          }
          const subScope = new Scope(scope);
          const result = executeBlockSync(stmt.body, subScope, outputFn, inputFn);
          if (result) {
            if (result.type === 'return') return result;
            if (result.type === 'break') break;
            if (result.type === 'continue') continue;
          }
        }
      } else if (stmt.type === 'for') {
        const itVal = evalInContext(stmt.iterable, scope.getFullContext());
        if (Array.isArray(itVal)) {
          for (const val of itVal) {
            const subScope = new Scope(scope);
            subScope.set(stmt.varName, val);
            const result = executeBlockSync(stmt.body, subScope, outputFn, inputFn);
            if (result) {
              if (result.type === 'return') return result;
              if (result.type === 'break') break;
              if (result.type === 'continue') continue;
            }
          }
        } else {
          throw new Error(`"${stmt.iterable}" is not iterable`);
        }
      } else if (stmt.type === 'fn') {
        scope.set(stmt.name, (...args) => {
          const funcScope = new Scope(scope);
          stmt.args.forEach((argName, idx) => {
            funcScope.set(argName, args[idx]);
          });
          const result = executeBlockSync(stmt.body, funcScope, outputFn, inputFn);
          if (result && result.type === 'return') {
            return result.value;
          }
          return undefined;
        });
      } else if (stmt.type === 'return') {
        const val = evalInContext(stmt.expr, scope.getFullContext());
        return { type: 'return', value: val };
      } else if (stmt.type === 'break') {
        return { type: 'break' };
      } else if (stmt.type === 'continue') {
        return { type: 'continue' };
      }
    } catch (err) {
      throw new Error(`Line ${stmt.lineIndex + 1}: ${err.message}`);
    }
  }
}

export function runPyrite(code, outputFn, inputFn = () => '') {
  try {
    const preprocessed = preprocess(code);
    const { statements } = parseBlocks(preprocessed);
    const grouped = groupIfBranches(statements);
    
    const scope = new Scope();
    
    // Built-in print / show
    scope.set('print', (...args) => {
      const strArgs = args.map(arg => {
        if (arg === null) return 'None';
        if (arg === undefined) return 'None';
        if (typeof arg === 'boolean') return arg ? 'True' : 'False';
        if (Array.isArray(arg)) return '[' + arg.map(x => typeof x === 'string' ? `'${x}'` : String(x)).join(', ') + ']';
        if (typeof arg === 'object') return JSON.stringify(arg);
        return String(arg);
      });
      outputFn(strArgs.join(' '));
    });
    scope.set('show', scope.get('print'));
    
    // Built-in len
    scope.set('len', (item) => {
      if (item && typeof item.length === 'number') return item.length;
      return 0;
    });
    
    // Built-in range
    scope.set('range', (a, b, c) => {
      let start = 0, end = a, step = 1;
      if (b !== undefined) {
        start = a;
        end = b;
      }
      if (c !== undefined) {
        step = c;
      }
      const result = [];
      if (step > 0) {
        for (let i = start; i < end; i += step) result.push(i);
      } else if (step < 0) {
        for (let i = start; i > end; i += step) result.push(i);
      }
      return result;
    });
    
    // Standard math/helpers
    scope.set('abs', Math.abs);
    scope.set('random', Math.random);
    scope.set('randint', (a, b) => Math.floor(Math.random() * (b - a + 1)) + a);
    scope.set('str', (x) => String(x));
    scope.set('num', (x) => Number(x));
    scope.set('int', (x) => Math.floor(Number(x)));
    scope.set('float', (x) => Number(x));
    
    // GUI / Canvas Window operations
    scope.set('create_app', (title, w, h) => {
      if (typeof window !== 'undefined' && window.launchPyriteGuiApp) {
        window.launchPyriteGuiApp({ title, width: w, height: h });
      } else {
        outputFn(`[GUI Warning] create_app("${title}", ${w}, ${h}) - GUI environment not available.`);
      }
    });

    scope.set('register_draw', (fn) => {
      if (typeof window !== 'undefined' && window.registerPyriteGuiDraw) {
        window.registerPyriteGuiDraw(fn);
      }
    });

    scope.set('register_click', (fn) => {
      if (typeof window !== 'undefined' && window.registerPyriteGuiClick) {
        window.registerPyriteGuiClick(fn);
      }
    });

    scope.set('register_key', (fn) => {
      if (typeof window !== 'undefined' && window.registerPyriteGuiKey) {
        window.registerPyriteGuiKey(fn);
      }
    });

    // Canvas drawing operations
    scope.set('clear', (color) => {
      if (currentCanvasCtx) {
        currentCanvasCtx.fillStyle = color || '#000000';
        currentCanvasCtx.fillRect(0, 0, currentCanvasCtx.canvas.width, currentCanvasCtx.canvas.height);
      }
    });

    scope.set('rect', (x, y, w, h, color) => {
      if (currentCanvasCtx) {
        currentCanvasCtx.fillStyle = color || '#ffffff';
        currentCanvasCtx.fillRect(x, y, w, h);
      }
    });

    scope.set('circle', (x, y, r, color) => {
      if (currentCanvasCtx) {
        currentCanvasCtx.fillStyle = color || '#ffffff';
        currentCanvasCtx.beginPath();
        currentCanvasCtx.arc(x, y, r, 0, 2 * Math.PI);
        currentCanvasCtx.fill();
      }
    });

    scope.set('line', (x1, y1, x2, y2, color) => {
      if (currentCanvasCtx) {
        currentCanvasCtx.strokeStyle = color || '#ffffff';
        currentCanvasCtx.lineWidth = 1;
        currentCanvasCtx.beginPath();
        currentCanvasCtx.moveTo(x1, y1);
        currentCanvasCtx.lineTo(x2, y2);
        currentCanvasCtx.stroke();
      }
    });

    scope.set('text', (str, x, y, size, color) => {
      if (currentCanvasCtx) {
        currentCanvasCtx.fillStyle = color || '#ffffff';
        currentCanvasCtx.font = `${size || 12}px sans-serif`;
        currentCanvasCtx.fillText(String(str), x, y);
      }
    });
    
    const result = executeBlockSync(grouped, scope, outputFn, inputFn);
    if (result && result.type === 'return') {
      return result.value;
    }
  } catch (err) {
    outputFn(`[Interpreter Error] ${err.message}`);
    throw err;
  }
}
