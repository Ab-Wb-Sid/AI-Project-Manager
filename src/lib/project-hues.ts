import { useMemo } from "react";

import { getProjects } from "./api";
import { hueFor } from "./constants";
import { useApi } from "./use-api";

/**
 * Project colors follow creation order. Generated ids (cuid) sort by creation time,
 * so sorting the ids the viewer can see gives a stable order without extra API fields.
 */
export function buildHueMap(projects: { id: string }[]) {
  const ids = projects.map((p) => p.id).sort();
  return new Map(ids.map((id, i) => [id, hueFor(i)]));
}

export function colorFor(map: Map<string, string>, id: string) {
  return map.get(id) ?? hueFor(0);
}

/** For screens that don't already load the project list (detail, my tasks, transcript result). */
export function useProjectHues(refreshKey = "") {
  const projects = useApi(`projects-hues:${refreshKey}`, getProjects);
  return useMemo(() => buildHueMap(projects.data ?? []), [projects.data]);
}
