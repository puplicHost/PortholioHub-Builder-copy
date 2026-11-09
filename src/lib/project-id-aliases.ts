/**
 * Project rows are created with temporary client ids (`new-…`) and receive
 * their database id in the save response. A card editor that stays open across
 * that save must follow the alias, never keep targeting the temp id.
 */
export type ProjectIdAliases = Record<string, string>

export function resolveProjectId(
  id: string | null | undefined,
  aliases: ProjectIdAliases | null | undefined,
): string {
  if (!id) return ''
  return aliases?.[id] || id
}
