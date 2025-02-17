import axios from "axios";
import { Preferences } from "./bookmarks";
import { VaultResults } from "./obsidian-plugin-model";

export async function fetchData(
  query: string,
  socketPath: string,
): Promise<{ data: VaultResults }> {
  const http = axios.create({
    socketPath: socketPath,
    baseURL: `http://localhost`,
    timeout: 20000,
  });

    return await http({
      method: "GET",
      url: "/?query=" + query + "&limit=100&capability=flat",
      headers: {
        "Content-Type": "application/json",
      },
    });
}

function extractVaultName(path: string): string {
  // /tmp/raycast-Obsidian Vault.sock
  return path.replace("/tmp/raycast-", "").replace(".sock", "");
}

export async function searchBookmarks(
  query: string,
  preferences: Preferences,
): Promise<VaultResults[]> {
  const vaults = preferences.socketPath.split(",").map((it) => {
    return {
      socket: it.trim(),
      vault: extractVaultName(it),
    };
  });

  const promises = vaults.map((it) => getVaultResults(query, it));
  const results = await Promise.all(promises);
  return results;
}

async function getVaultResults(
  query: string,
  it: { socket: string; vault: string },
): Promise<VaultResults> {
  try {
    const res = await fetchData(query, it.socket);
    return res.data;
  } catch (error) {
    console.error(`Error getting results for vault ${it.vault}:`, error);
    return {
      vault: it.vault,
      results: [],
      error: `Tree Search >= 0.10.xx required on vault ${it.socket} - Please open this vault in Obsidian to install it`,
    };
  }
}

