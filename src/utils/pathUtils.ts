import { FileLocation } from "~/stores/global/globalStore";

export const getFileNameAndPath = (
  fullPath: string,
): FileLocation | undefined => {
  var filePath = fullPath.substring(0, fullPath.lastIndexOf("\\"));
  var fileName = fullPath.split("\\").pop()?.split("/").pop();

  if (filePath === undefined || fileName === undefined) return undefined;
  else {
    return {
      path: filePath,
      name: fileName,
    };
  }
};
