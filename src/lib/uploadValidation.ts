export const MAX_SCENE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_SCENE_EXTENSION = ".scn";

export interface SceneFileLike {
  name: string;
  size: number;
}

export function formatBytes(n?: number) {
  if (!n && n !== 0) return "-";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function validateSceneFile(file: SceneFileLike): string | null {
  const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase() : "";

  if (extension !== ACCEPTED_SCENE_EXTENSION) {
    return "Choose a Behringer X32 or Midas M32 .scn scene file.";
  }

  if (file.size === 0) {
    return "That scene file is empty. Export the scene from your console or X32-Edit, then try again.";
  }

  if (file.size > MAX_SCENE_BYTES) {
    return `Scene files must be ${formatBytes(MAX_SCENE_BYTES)} or smaller. This file is ${formatBytes(file.size)}.`;
  }

  return null;
}
