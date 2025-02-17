export interface VaultResults {
  vault: string;
  results: IndividualListItemModel[];
  error?: string;
}

export interface IndividualListItemModel {
  title: string,
  level: number,
  index: number,
  nodeType: string,
  actions: RaycastAction[]
}

export type RaycastAction = Copy | Browse

export type BaseAction = {
  icon: string
  title: string
  shortcut?: { modifiers: string[], key: string }
}

export interface Copy extends BaseAction {
  type: "copy"
  text: string
}

export interface Browse extends BaseAction {
  type: "browse"
  url: string
}