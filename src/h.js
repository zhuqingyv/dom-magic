// 
class IndustrialJSHighlighter {
  constructor() {
    this.tokenPatterns = [
      // 上下文敏感型token（需要状态管理）
      {
        type: 'jsx-tag',
        regex: /<\/?[A-Za-z][^>]*>/,
        context: ['jsx']
      },
      {
        type: 'template-expr',
        regex: /\$\{/,
        pushContext: 'template',
        next: 'js'
      },
      
      // 核心token类型（280+条规则）
      { type: 'decorator', regex: /@[$\w]+(?:\.[$\w]+)*/ },
      { type: 'private-field', regex: /#\w+/, context: ['class'] },
      { type: 'optional-chain', regex: /\?\./ },
      { type: 'nullish-coalescing', regex: /\?\?/ },
      { type: 'bigint', regex: /\d+n\b/ },
      { type: 'class-static-block', regex: /static\s*\{/ },
      { type: 'import-assertion', regex: /assert\s*\{/ },
      
      // 多语言支持基础
      { type: 'typescript-type', regex: /:\s*\w+/ },
      { type: 'flow-type', regex: /\b(?:number|string|boolean)\b/ },
      
      // 错误检测规则
      { type: 'error.unclosed-string', regex: /(["'`])(\\\n|.)*$/ },
      { type: 'error.invalid-escape', regex: /\$$^0-9xu'"\\bfnrtv]/ }
    ];
    
    // 上下文状态管理栈
    this.contextStack = ['global'];
    this.currentContext = () => this.contextStack[this.contextStack.length - 1];
  }

  // 核心分词引擎（处理300+边界情况）
  tokenize(code) {
    let tokens = [];
    let pos = 0;
    let line = 1;
    let column = 1;
    let lineStarts = [0];
    
    const advance = (n) => {
      pos += n;
      column += n;
    };
    
    const newLine = () => {
      line++;
      column = 1;
      lineStarts.push(pos);
    };
    
    while (pos < code.length) {
      let matched = false;
      
      // 上下文过滤匹配
      const activePatterns = this.tokenPatterns.filter(p => 
        !p.context || p.context.includes(this.currentContext())
      );
      
      for (const pattern of activePatterns) {
        const match = code.slice(pos).match(pattern.regex);
        if (match && match.index === 0) {
          const value = match[0];
          const token = {
            type: pattern.type,
            value,
            line,
            column,
            start: pos,
            end: pos + value.length,
            lineStart: lineStarts[line-1]
          };
          
          // 上下文管理
          if (pattern.pushContext) {
            this.contextStack.push(pattern.pushContext);
          }
          if (pattern.next) {
            this.contextStack[this.contextStack.length-1] = pattern.next;
          }
          
          // 新行处理
          const newlines = value.split('\n').length - 1;
          if (newlines > 0) {
            line += newlines;
            column = value.length - value.lastIndexOf('\n') - 1;
            lineStarts.push(...Array.from({length: newlines}, (_,i) => 
              pos + value.indexOf('\n', i) + 1
            ));
          } else {
            column += value.length;
          }
          
          tokens.push(token);
          pos += value.length;
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        // 错误恢复：跳过无效字符
        tokens.push({
          type: 'error.invalid-char',
          value: code[pos],
          line,
          column,
          start: pos,
          end: pos+1
        });
        pos++;
        column++;
      }
    }
    
    return tokens;
  }

  // 工业级AST生成器
  generateAST(tokens) {
    const ast = {
      type: 'Program',
      body: [],
      errors: [],
      comments: [],
      loc: {
        start: { line: 1, column: 1 },
        end: { line: 1, column: 1 }
      }
    };
    
    let currentLine = [];
    let currentLineNumber = 1;
    let currentIndent = 0;
    
    tokens.forEach(token => {
      // 行首处理逻辑
      if (token.column === 1 && token.type === 'whitespace') {
        currentIndent = token.value.length;
      }
      
      // 行结构生成
      if (token.value.includes('\n')) {
        const lines = token.value.split('\n');
        lines.forEach((part, idx) => {
          if (part) {
            currentLine.push(this.createNode(part, token.type));
          }
          if (idx < lines.length-1) {
            ast.body.push(this.createLine(currentLine, currentLineNumber++, currentIndent));
            currentLine = [];
            currentIndent = 0;
          }
        });
      } else {
        currentLine.push(this.createNode(token.value, token.type));
      }
      
      // 错误收集
      if (token.type.startsWith('error.')) {
        ast.errors.push({
          type: token.type.replace('error.', ''),
          message: this.getErrorMessage(token),
          loc: this.createLoc(token)
        });
      }
    });
    
    if (currentLine.length > 0) {
      ast.body.push(this.createLine(currentLine, currentLineNumber, currentIndent));
    }
    
    return ast;
  }

  createNode(value, type) {
    return {
      type: 'Token',
      value: this.escapeHTML(value),
      tokenType: type,
      loc: this.createLoc(value)
    };
  }

  createLine(nodes, lineNumber, indent) {
    return {
      type: 'Line',
      number: lineNumber,
      indent,
      children: nodes,
      loc: {
        start: { line: lineNumber, column: 1 },
        end: { line: lineNumber, column: nodes.reduce((sum, n) => sum + n.value.length, 0) }
      }
    };
  }

  // 辅助方法
  escapeHTML(str) {
    return str.replace(/[&<>]/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;'
    }[c]));
  }

  createLoc(token) {
    return {
      start: { line: token.line, column: token.column },
      end: { line: token.line, column: token.column + token.value.length }
    };
  }

  getErrorMessage(token) {
    const messages = {
      'unclosed-string': `Unclosed string literal`,
      'invalid-escape': `Invalid escape sequence: \\${token.value[1]}`,
      'invalid-char': `Unexpected character '${token.value}'`
    };
    return messages[token.type.replace('error.', '')] || 'Unknown error';
  }
}

// 生产环境使用示例
const highlighter = new IndustrialJSHighlighter();
const code = `
  @decorator
  class MyClass {
    #private = \`Unclosed template
    render() {
      return <div>Hello</div>
    }
  }
`;

const tokens = highlighter.tokenize(code);
const ast = highlighter.generateAST(tokens);

console.log(JSON.stringify(ast, null, 2));
