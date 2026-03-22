import { useRef, useEffect } from "react";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { basicSetup } from "codemirror";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
}

export function CodeEditor({ value, onChange, onSubmit }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const submitKeymap = onSubmit
      ? keymap.of([
          {
            key: "Ctrl-Enter",
            run: () => {
              onSubmit();
              return true;
            },
          },
          {
            key: "Mod-Enter",
            run: () => {
              onSubmit();
              return true;
            },
          },
        ])
      : [];

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          python(),
          oneDark,
          placeholder("# Write your code here..."),
          submitKeymap,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChange(update.state.doc.toString());
            }
          }),
          EditorView.theme({
            "&": { height: "100%", fontSize: "14px" },
            ".cm-scroller": { overflow: "auto" },
            ".cm-content": { fontFamily: "var(--font-mono)" },
            ".cm-gutters": {
              backgroundColor: "transparent",
              borderRight: "1px solid var(--color-border)",
            },
          }),
        ],
      }),
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
    // Mount once — external value sync handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (e.g. after exercise refresh)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div className="rounded-xl border border-border bg-bg-surface overflow-hidden h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-bg-elevated">
        <div className="h-3 w-3 rounded-full bg-error/60" />
        <div className="h-3 w-3 rounded-full bg-warning/60" />
        <div className="h-3 w-3 rounded-full bg-success/60" />
        <span className="ml-2 text-xs text-text-muted">solution.py</span>
      </div>
      <div ref={containerRef} className="flex-1 overflow-hidden" />
    </div>
  );
}
