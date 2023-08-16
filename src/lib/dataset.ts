import { FilledTableData } from "@/lib/tables";
import { getSample } from "@/lib/tables";
import JSZip from "jszip";
import path from "path";

export type Dataset = {
  tables: FilledTableData[];
  dirname: string;
};

export function sampleDataset(): Dataset {
  return {
    tables: getSample(),
    dirname: "sample",
  }
}

export async function archive(dataset: Dataset): Promise<Blob> {
  const zip = new JSZip();
  const dir = zip.folder(dataset.dirname);
  for (const table of dataset.tables) {
      dir?.file(path.basename(table.file_name), JSON.stringify(table, undefined, 4));
  }
  return zip.generateAsync({type: "blob"});
}
