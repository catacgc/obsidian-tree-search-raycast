import {
  Action,
  ActionPanel,
  getPreferenceValues,
  Icon,
  List,
} from "@raycast/api";
import { ReactNode, useEffect, useState } from "react";
import { searchBookmarks, VaultResults } from "./fetch";
import debounce from "lodash.debounce";
import { ParsedNode, TreeNode } from "./obsidian-plugin-model";
import React from "react";
import { Token } from "markdown-it";
import { reverseMarkdownParsing } from "./copy";

export interface Preferences {
  socketPath: string;
}

type TreeNodeSearchProps = {
  node: TreeNode;
  vault: string;
  vaultColor: string;
  level: number;
  minExpand: number;
};

function getVaultColor(vault: string, vaults: string[]): string {
  if (vaults.length == 1) return "";

  const idx = vaults.indexOf(vault);
  if (idx == -1) return "🌕";
  return ["🔵", "🟢", "🟠", "🟣", "🔴", "🟡"][idx % 6];
}

export const IndividualListItem = (props: TreeNodeSearchProps) => {
  const item = props.node;
  const actionsAccumulator: ReactNode[] = [];
  const tokenText = RaycastTokenRenderer(
    [],
    actionsAccumulator,
    props.vault,
    item.node
  );
  actionsAccumulator.push(
    <AdvancedUriAction item={item} vault={props.vault} />,
  ); // default open action

  function getIcon(item: TreeNode) {
    if (
      item.node.nodeType == "page"
    ) {
      return Icon.Document;
    }

    if (
      item.node.nodeType == "text" && item.node.isTask
    ) {
      return Icon.Checkmark;
    }

    if (item.node.nodeType == "header") {
      return Icon.Hashtag;
    }

    return Icon.Text;
  }

  return (
    <List.Item
      key={item.index}
      title={`${props.level > 0 ? "|" : ""}${"–".repeat(props.level)} ${tokenText}`}
      accessories={[
        { icon: getIcon(item), tooltip: item.node.nodeType },
        { text: props.vaultColor, tooltip: props.vault },
      ]}
//       detail={
//         <List.Item.Detail
//           markdown={`
// **${item.value}**
//
// - url: ${item.value}
// - src: ${getMarkdownUri(item.attrs.location, props.vault)}
// - tag: ${item.attrs.tags}
//     `}
//         />
//       }
      actions={<ActionPanel>{...actionsAccumulator}</ActionPanel>}
    />
  );
};

export default function Command() {
  const [searchText, setSearchText] = useState("");

  const [filtered, setFiltered] = useState<VaultResults[]>([]);

  const debouncer = debounce(async (searchText: string) => {
    if (!searchText) {
      return;
    }

    const result = await searchBookmarks(
      searchText,
      getPreferenceValues<Preferences>(),
    );
    setFiltered(result);
  }, 100);

  useEffect(() => {
    debouncer(searchText);

    return () => {
      debouncer.cancel();
    };
  }, [searchText]);

  return (
    <List
      navigationTitle="Tree Search"
      searchBarPlaceholder="Obsidian Tree Search"
      filtering={false}
      // throttle={true}
      onSearchTextChange={setSearchText}
      isShowingDetail={false}
    >
      {filtered.filter(vault => vault.error).map(vault => <List.Item key={vault.vault} title={vault.error || ""} />)}
      {filtered.filter(vault => vault && !vault.error).flatMap((vault) =>
        vault.results.map((item, idx) => (
          <IndividualListItem
            key={`t${vault.vault}${idx}`}
            vaultColor={getVaultColor(
              vault.vault,
              filtered.map((it) => it.vault),
            )}
            vault={vault.vault}
            node={item}
            level={item.indent}
            minExpand={5}
          />
        )),
      )}
    </List>
  );
}

function AdvancedUriAction(props: { item: TreeNode; vault: string }) {
  const item = props.item;
  return (
    <>
      <Action.OpenInBrowser
        title="See in Obsidian"
        url={getUrl(item.node.location, props.vault)}
        shortcut={{ modifiers: ["shift"], key: "enter" }}
        icon={Icon.Pencil}
      />
      <Action.OpenInBrowser
        title="Insert After"
        url={getInsertUrl(item.node.location, props.vault)}
        shortcut={{ modifiers: ["ctrl"], key: "i" }}
        icon={Icon.Pencil}
      />

      <Action.CopyToClipboard
        title="Copy to clipboard"
        content={reverseMarkdownParsing(item.node)}
        shortcut={{ modifiers: ["ctrl"], key: "c" }}
        icon={Icon.Clipboard}
      />
    </>
  );
}

function getInsertUrl(item: TreeNode["node"]["location"], vault: string): string {
  const uri = `raycastaction=insert&vault=${vault}&filepath=${item.path}&sl=${item.position.start.line}&sc=${item.position.start.ch}&el=${item.position.end.line}&ec=${item.position.end.ch}`;
  return `obsidian://tree-search-uri?${encodeURI(uri)}`;
}

function getUrl(item: TreeNode["node"]["location"], vault: string): string {
  const uri = `raycastaction=open&vault=${vault}&filepath=${item.path}&sl=${item.position.start.line}&sc=${item.position.start.ch}&el=${item.position.end.line}&ec=${item.position.end.ch}`;
  return `obsidian://tree-search-uri?${encodeURI(uri)}`;
}

function RaycastTokenRenderer(
  tokens: Token[],
  actions: ReactNode[],
  vault: string,
  node?: ParsedNode,
): string {

  switch(node?.nodeType) {
    case "text":
      return RaycastTokenRenderer(node.tokens, actions, vault);
    case "header":
      return `${node.page} > ${node.header}`;
    case "page":
      return `${node.page}`;
  }

  if (tokens.length == 0) return "";

  const token = tokens[0];

  if (token.type == "inline" && token.children) {
    return RaycastTokenRenderer(token.children, actions, vault);
  }

  if (token.type == "obsidian_link") {
    let fileName = token.content.split("|")[0];
    fileName = fileName.split("#")[0];

    actions.push(
      <Action.OpenInBrowser
        title={`Open 🔹${token.content}`}
        url={`obsidian://open?vault=${vault}&file=${fileName}`}
      />,
    );

    return (
      "🔹" +
      token.content +
      RaycastTokenRenderer(tokens.slice(1), actions, vault)
    );
  }

  if (token.type == "link_open") {
    const href = decodeURI(token.attrs?.[0]?.[1] || "#");
    const content = tokens[1]?.content;

    actions.push(
      <Action.OpenInBrowser title={`Browse 🔗${content}`} url={href} />,
    );

    return (
      "🔗 " + content + RaycastTokenRenderer(tokens.slice(2), actions, vault)
    );
  }

  if (token.type == "link_close") {
    return RaycastTokenRenderer(tokens.slice(1), actions, vault);
  }

  if (token.type == "text") {
    if (token.content.trim().startsWith("http")) {
      actions.push(
        <Action.OpenInBrowser
          title={`Browse 🔗${token.content}`}
          url={token.content.trim()}
        />,
      );

      return (
        "🔗 " +
        token.content +
        RaycastTokenRenderer(tokens.slice(1), actions, vault)
      );
    }
    return (
      token.content + RaycastTokenRenderer(tokens.slice(1), actions, vault)
    );
  }

  if (token.type == "strong_open") {
    return (
      token.content + RaycastTokenRenderer(tokens.slice(1), actions, vault)
    );
  }

  if (token.type == "strong_close") {
    return (
      token.content + RaycastTokenRenderer(tokens.slice(1), actions, vault)
    );
  }

  if (token.type == "em_open") {
    return (
      token.content + RaycastTokenRenderer(tokens.slice(1), actions, vault)
    );
  }

  if (token.type == "softbreak") {
    return (
      token.content + RaycastTokenRenderer(tokens.slice(1), actions, vault)
    );
  }

  if (token.type == "s_open") {
    return (
      token.content + RaycastTokenRenderer(tokens.slice(1), actions, vault)
    );
  }

  if (token.type == "image") {
    return (
      "🖼️ " +
      token.content +
      RaycastTokenRenderer(tokens.slice(1), actions, vault)
    );
  }

  if (token.type == "code_inline") {
    actions.push(
      <Action.CopyToClipboard
        title={`Copy ${token.content} to clipboard`}
        content={token.content}
      />,
    );
    return (
      "📋 " +
      token.content +
      RaycastTokenRenderer(tokens.slice(1), actions, vault)
    );
  }

  // if (!token.type.includes("_close")) console.log("tokens not rendered: ", tokens)

  return token.content + RaycastTokenRenderer(tokens.slice(1), actions, vault);
}
