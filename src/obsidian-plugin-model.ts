import { Token } from "markdown-it";

export type IndexedResult = { nodes: ResultNode[]; total: number };

export type ResultNode = {
  index: number;
  value: string;
  attrs: NodeAttributes;
  children: ResultNode[];
  parents: string[];
};

export type NodeAttributes = {
  location: Location;
  tokens: Token[];
  tags: string[];
  aliases: string[];
  searchKey: string;
  nodeType:
    | "page"
    | "text"
    | "task"
    | "completed-task"
    | "virtual-page"
    | "header";
};

export type Location = {
  path: string;
  position: {
    start: {
      line: number;
      ch: number;
    };
    end: {
      line: number;
      ch: number;
    };
  };
};

export default {};
