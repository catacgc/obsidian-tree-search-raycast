import {
  Action,
  ActionPanel,
  getPreferenceValues,
  Icon,
  List,
} from "@raycast/api";
import { ReactNode, useEffect, useState } from "react";
import { searchBookmarks } from "./fetch";
import debounce from "lodash.debounce";
import { IndividualListItemModel, RaycastAction, VaultResults } from "./obsidian-plugin-model";

export interface Preferences {
  socketPath: string;
}

type TreeNodeSearchProps = {
  node: IndividualListItemModel;
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
  const actionsAccumulator: ReactNode[] = item.actions.map(action => <AdvancedUriAction action={action} />);
  const tokenText = item.title;

  function getIcon(item: IndividualListItemModel) {

    switch(item.nodeType) {
      case "page":
        return Icon.Document;
      case "text":
        return Icon.Text;
      case "header":
        return Icon.Hashtag;
    }

    return Icon.Text;
  }

  return (
    <List.Item
      key={item.index}
      title={`${props.level > 0 ? "|" : ""}${"–".repeat(props.level)} ${tokenText}`}
      accessories={[
        { icon: getIcon(item), tooltip: item.nodeType },
        { text: props.vaultColor, tooltip: props.vault },
      ]}
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
            level={item.level}
            minExpand={5}
          />
        )),
      )}
    </List>
  );
}

function AdvancedUriAction(props: { action: RaycastAction }) {
  switch(props.action.type) {
    case "browse":
      return <Action.OpenInBrowser title={props.action.title} 
      url={props.action.url}
      shortcut={props.action.shortcut as any}
      />
    case "copy":
      return <Action.CopyToClipboard 
      title={props.action.title} 
      content={props.action.text} 
      shortcut={props.action.shortcut as any}
      />
  }
}
