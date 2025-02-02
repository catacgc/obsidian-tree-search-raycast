import { Token } from "markdown-it";

export type TreeNode = {
  attrs: NodeAttributes,
  indent: number,
  hasChildren: boolean
  visible: boolean
  selected: boolean
  index: number
}

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
