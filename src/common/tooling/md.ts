import katex from "katex";
import marked from "marked";

type MarkdownSection = {
  title: string;
  content: string;
};

// KaTeX rendering
// From https://github.com/markedjs/marked/issues/1538#issuecomment-526189561
const renderer = new marked.Renderer();

let i = 0;
const next_id = () => `__special_katext_id_${i++}__`;
const math_expressions: {
  [key: string]: { type: "block" | "inline"; expression: string };
} = {};

function replace_math_with_ids(text: string) {
  // Qllowing newlines inside of `$$...$$`
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_match, expression) => {
    const id = next_id();
    math_expressions[id] = { type: "block", expression };
    return id;
  });

  // Not allowing newlines or space inside of `$...$`
  text = text.replace(/\$([^\n\s]+?)\$/g, (_match, expression) => {
    const id = next_id();
    math_expressions[id] = { type: "inline", expression };
    return id;
  });

  return text;
}

const original_listitem = renderer.listitem;
renderer.listitem = function (text: string) {
  return original_listitem.call(
    this,
    replace_math_with_ids(text),
    false,
    false
  );
};

const original_paragraph = renderer.paragraph;
renderer.paragraph = function (text: string) {
  return original_paragraph.call(this, replace_math_with_ids(text));
};

const original_tablecell = renderer.tablecell;
renderer.tablecell = function (
  content: string,
  flags: {
    header: boolean;
    align: "center" | "left" | "right" | null;
  }
) {
  return original_tablecell.call(this, replace_math_with_ids(content), flags);
};

// Inline level, maybe unneded
const original_text = renderer.text;
renderer.text = function (text: string) {
  return original_text.call(this, replace_math_with_ids(text));
};

export function parse(md: string): MarkdownSection[] {
  const sections = md.split("---");
  return sections.map((section) => {
    const split = section.split("\n");
    return {
      title: split[0].replaceAll("#", ""),
      content: marked
        .parse(split.slice(1).join("\n"), { renderer: renderer })
        .replace(/(__special_katext_id_\d+__)/g, (_match, capture) => {
          const { type, expression } = math_expressions[capture];
          return katex.renderToString(expression, {
            displayMode: type == "block",
          });
        }),
    };
  });
}
