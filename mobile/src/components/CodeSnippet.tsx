import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "../theme/theme";

interface Props {
  code: string;
}

export function CodeSnippet({ code }: Props) {
  const highlighted = React.useMemo(() => highlightJavaScript(code), [code]);

  return (
    <View style={styles.container} accessibilityLabel="Code snippet">
      <ScrollView style={styles.codeVerticalScroll} nestedScrollEnabled>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.codeBlock}>
            {highlighted.map((line, lineIndex) => (
              <Text key={lineIndex} style={styles.code}>
                {line.map((token, tokenIndex) => (
                  <Text key={`${lineIndex}-${tokenIndex}`} style={{ color: token.color }}>
                    {token.text}
                  </Text>
                ))}
              </Text>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
      <View style={styles.output}>
        <Text style={styles.outputTitle}>Live Output</Text>
        <Text style={styles.outputValue}>$ output preview ready</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
    marginVertical: spacing.lg,
  },
  codeVerticalScroll: { maxHeight: 170 },
  code: {
    color: "#d1d5db",
    fontFamily: "monospace",
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  codeBlock: { padding: spacing.lg },
  output: {
    borderTopWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    backgroundColor: "#111827",
  },
  outputTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  outputValue: {
    color: colors.success,
    fontSize: fontSize.base,
    fontFamily: "monospace",
  },
});

function highlightJavaScript(code: string): Array<Array<{ text: string; color: string }>> {
  const keywordRegex = /\b(const|let|var|function|return|if|else|for|while|async|await|new|typeof)\b/g;
  const stringRegex = /(['"`])(?:(?=(\\?))\2.)*?\1/g;
  const numberRegex = /\b\d+(\.\d+)?\b/g;

  return code.split("\n").map((line) => {
    const tokens: Array<{ text: string; color: string }> = [];
    let cursor = 0;
    const matches: Array<{ start: number; end: number; color: string }> = [];

    const collect = (regex: RegExp, color: string) => {
      let match = regex.exec(line);
      while (match) {
        matches.push({ start: match.index, end: match.index + match[0].length, color });
        match = regex.exec(line);
      }
    };

    collect(new RegExp(stringRegex), "#FCA5A5");
    collect(new RegExp(numberRegex), "#93C5FD");
    collect(new RegExp(keywordRegex), "#FCD34D");
    matches.sort((a, b) => a.start - b.start);

    for (const match of matches) {
      if (match.start < cursor) continue;
      if (match.start > cursor) {
        tokens.push({ text: line.slice(cursor, match.start), color: "#D1D5DB" });
      }
      tokens.push({ text: line.slice(match.start, match.end), color: match.color });
      cursor = match.end;
    }
    if (cursor < line.length) {
      tokens.push({ text: line.slice(cursor), color: "#D1D5DB" });
    }
    return tokens.length > 0 ? tokens : [{ text: line || " ", color: "#D1D5DB" }];
  });
}
