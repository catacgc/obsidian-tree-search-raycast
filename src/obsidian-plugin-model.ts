import { Token } from "markdown-it";

export type TreeNode = {
  node: ParsedNode,
  indent: number,
  hasChildren: boolean
  visible: boolean
  selected: boolean
  index: number
}

export type BaseNode = {
	searchKey: string,
	location: Location,
}

export type PageNode = BaseNode & {
	nodeType: "page",
	isReference: boolean,
	page: string,
	aliases: string[],
	tags: string[],
}

export type TextNode = BaseNode & {
	nodeType: "text",
	tokens: Token[],
	tags: string[],
	isTask: boolean,
	isCompleted: boolean,
}

export type HeaderNode = BaseNode & {
	nodeType: "header",
	page: string,
	header: string,
	isReference: boolean
}

export type ParsedNode = BaseNode & (PageNode | TextNode | HeaderNode)

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
