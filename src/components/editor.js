import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

// Python keywords and builtins for autocomplete
const PYTHON_COMPLETIONS = [
  // Built-in functions
  { label: 'print', detail: 'print(*objects, sep=" ", end="\\n")', insert: 'print($1)', kind: 'function' },
  { label: 'len', detail: 'len(s)', insert: 'len($1)', kind: 'function' },
  { label: 'range', detail: 'range(stop) or range(start, stop[, step])', insert: 'range($1)', kind: 'function' },
  { label: 'list', detail: 'list([iterable])', insert: 'list($1)', kind: 'function' },
  { label: 'dict', detail: 'dict(**kwargs)', insert: 'dict($1)', kind: 'function' },
  { label: 'set', detail: 'set([iterable])', insert: 'set($1)', kind: 'function' },
  { label: 'tuple', detail: 'tuple([iterable])', insert: 'tuple($1)', kind: 'function' },
  { label: 'str', detail: 'str(object="")', insert: 'str($1)', kind: 'function' },
  { label: 'int', detail: 'int(x=0)', insert: 'int($1)', kind: 'function' },
  { label: 'float', detail: 'float(x=0.0)', insert: 'float($1)', kind: 'function' },
  { label: 'bool', detail: 'bool(x=False)', insert: 'bool($1)', kind: 'function' },
  { label: 'type', detail: 'type(object)', insert: 'type($1)', kind: 'function' },
  { label: 'isinstance', detail: 'isinstance(object, classinfo)', insert: 'isinstance($1, $2)', kind: 'function' },
  { label: 'enumerate', detail: 'enumerate(iterable, start=0)', insert: 'enumerate($1)', kind: 'function' },
  { label: 'zip', detail: 'zip(*iterables)', insert: 'zip($1)', kind: 'function' },
  { label: 'map', detail: 'map(function, iterable)', insert: 'map($1, $2)', kind: 'function' },
  { label: 'filter', detail: 'filter(function, iterable)', insert: 'filter($1, $2)', kind: 'function' },
  { label: 'sorted', detail: 'sorted(iterable, key=None, reverse=False)', insert: 'sorted($1)', kind: 'function' },
  { label: 'max', detail: 'max(iterable)', insert: 'max($1)', kind: 'function' },
  { label: 'min', detail: 'min(iterable)', insert: 'min($1)', kind: 'function' },
  { label: 'sum', detail: 'sum(iterable)', insert: 'sum($1)', kind: 'function' },
  { label: 'abs', detail: 'abs(x)', insert: 'abs($1)', kind: 'function' },
  { label: 'round', detail: 'round(number, ndigits=None)', insert: 'round($1)', kind: 'function' },
  { label: 'open', detail: 'open(file, mode="r", encoding=None)', insert: "open($1, 'r')", kind: 'function' },
  { label: 'input', detail: 'input(prompt="")', insert: 'input($1)', kind: 'function' },
  { label: 'hasattr', detail: 'hasattr(object, name)', insert: 'hasattr($1, $2)', kind: 'function' },
  { label: 'getattr', detail: 'getattr(object, name[, default])', insert: 'getattr($1, $2)', kind: 'function' },
  { label: 'setattr', detail: 'setattr(object, name, value)', insert: 'setattr($1, $2, $3)', kind: 'function' },
  { label: 'vars', detail: 'vars([object])', insert: 'vars($1)', kind: 'function' },
  { label: 'dir', detail: 'dir([object])', insert: 'dir($1)', kind: 'function' },
  { label: 'repr', detail: 'repr(object)', insert: 'repr($1)', kind: 'function' },
  { label: 'format', detail: 'format(value, format_spec="")', insert: 'format($1)', kind: 'function' },
  // Keywords
  { label: 'def', detail: 'Define a function', insert: 'def ${1:function_name}(${2:args}):\n    ${3:pass}', kind: 'keyword' },
  { label: 'class', detail: 'Define a class', insert: 'class ${1:ClassName}:\n    def __init__(self):\n        ${2:pass}', kind: 'keyword' },
  { label: 'import', detail: 'Import a module', insert: 'import ${1:module}', kind: 'keyword' },
  { label: 'from', detail: 'From import', insert: 'from ${1:module} import ${2:name}', kind: 'keyword' },
  { label: 'if', detail: 'If statement', insert: 'if ${1:condition}:\n    ${2:pass}', kind: 'keyword' },
  { label: 'elif', detail: 'Elif clause', insert: 'elif ${1:condition}:\n    ${2:pass}', kind: 'keyword' },
  { label: 'else', detail: 'Else clause', insert: 'else:\n    ${1:pass}', kind: 'keyword' },
  { label: 'for', detail: 'For loop', insert: 'for ${1:item} in ${2:iterable}:\n    ${3:pass}', kind: 'keyword' },
  { label: 'while', detail: 'While loop', insert: 'while ${1:condition}:\n    ${2:pass}', kind: 'keyword' },
  { label: 'try', detail: 'Try-except block', insert: 'try:\n    ${1:pass}\nexcept Exception as e:\n    ${2:pass}', kind: 'keyword' },
  { label: 'with', detail: 'Context manager', insert: 'with ${1:expression} as ${2:name}:\n    ${3:pass}', kind: 'keyword' },
  { label: 'lambda', detail: 'Lambda function', insert: 'lambda ${1:args}: ${2:expr}', kind: 'keyword' },
  { label: 'return', detail: 'Return value', insert: 'return ${1:value}', kind: 'keyword' },
  { label: 'yield', detail: 'Yield value', insert: 'yield ${1:value}', kind: 'keyword' },
  { label: 'raise', detail: 'Raise exception', insert: 'raise ${1:Exception}("${2:message}")', kind: 'keyword' },
  { label: 'assert', detail: 'Assert statement', insert: 'assert ${1:condition}, "${2:message}"', kind: 'keyword' },
  { label: 'pass', detail: 'No-op statement', insert: 'pass', kind: 'keyword' },
  { label: 'break', detail: 'Break loop', insert: 'break', kind: 'keyword' },
  { label: 'continue', detail: 'Continue loop', insert: 'continue', kind: 'keyword' },
  { label: 'global', detail: 'Declare global variable', insert: 'global ${1:var}', kind: 'keyword' },
  { label: 'nonlocal', detail: 'Declare nonlocal variable', insert: 'nonlocal ${1:var}', kind: 'keyword' },
  { label: 'True', detail: 'Boolean True', insert: 'True', kind: 'value' },
  { label: 'False', detail: 'Boolean False', insert: 'False', kind: 'value' },
  { label: 'None', detail: 'None value', insert: 'None', kind: 'value' },
  // Common patterns
  { label: 'ifmain', detail: 'if __name__ == "__main__"', insert: 'if __name__ == "__main__":\n    ${1:main()}', kind: 'snippet' },
  { label: 'listcomp', detail: 'List comprehension', insert: '[${1:expr} for ${2:item} in ${3:iterable}]', kind: 'snippet' },
  { label: 'dictcomp', detail: 'Dict comprehension', insert: '{${1:k}: ${2:v} for ${3:k}, ${4:v} in ${5:items}}', kind: 'snippet' },
];

const kindToMonaco = (kind, monaco) => {
  const k = monaco.languages.CompletionItemKind;
  return { function: k.Function, keyword: k.Keyword, value: k.Value, snippet: k.Snippet }[kind] ?? k.Text;
};

const setupPythonAutocomplete = (monaco) => {
  monaco.languages.registerCompletionItemProvider('python', {
    triggerCharacters: ['.', '"', "'"],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      const suggestions = PYTHON_COMPLETIONS
        .filter(c => c.label.toLowerCase().startsWith(word.word.toLowerCase()))
        .map(c => ({
          label: c.label,
          kind: kindToMonaco(c.kind, monaco),
          detail: c.detail,
          insertText: c.insert,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          documentation: c.detail,
        }));

      return { suggestions };
    }
  });
};

const EditorComponent = ({ code, onChange, markers = [] }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const setupDone = useRef(false);

  const handleEditorWillMount = (monaco) => {
    if (!setupDone.current) {
      setupPythonAutocomplete(monaco);
      setupDone.current = true;
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Add keyboard shortcut: Ctrl+Enter to trigger run
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      window.dispatchEvent(new CustomEvent('editor-run'));
    });
    // Ctrl+S to save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      window.dispatchEvent(new CustomEvent('editor-save'));
    });
  };

  // Apply markers (squiggles)
  useEffect(() => {
    if (!monacoRef.current || !editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;
    const monacoMarkers = markers.map(m => ({
      startLineNumber: m.line || 1,
      startColumn: m.column || 1,
      endLineNumber: m.line || 1,
      endColumn: (m.column || 1) + Math.max(20, (m.message || '').length),
      message: m.message,
      severity: m.type === 'error' ? 8 : m.type === 'warning' ? 4 : 1,
    }));
    monacoRef.current.editor.setModelMarkers(model, 'cleancodex', monacoMarkers);
  }, [markers]);

  return (
    <Editor
      height="100%"
      language="python"
      value={code}
      theme="vs-dark"
      beforeMount={handleEditorWillMount}
      onMount={handleEditorDidMount}
      onChange={(value) => onChange(value ?? '')}
      options={{
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 20 },
        suggestOnTriggerCharacters: true,
        quickSuggestions: { other: true, comments: false, strings: false },
        acceptSuggestionOnEnter: 'smart',
        tabCompletion: 'on',
        wordBasedSuggestions: 'currentDocument',
        parameterHints: { enabled: true },
        hover: { enabled: true },
        lineNumbersMinChars: 3,
        renderWhitespace: 'none',
        smoothScrolling: true,
        cursorBlinking: 'phase',
        cursorSmoothCaretAnimation: 'on',
        bracketPairColorization: { enabled: true },
        formatOnPaste: false,
      }}
    />
  );
};

export default EditorComponent;
