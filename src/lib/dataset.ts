import { FilledTableData } from "@/lib/tables";
import { getSample } from "@/lib/tables";
import JSZip from "jszip";
import path from "path";
import { computeSetHash } from "./digest";

export type Dataset = {
  tables: {
    data: FilledTableData,
    filename: string,
  }[];
  dirname: string;
};


export async function computeDatasetHash(dataset: Dataset): Promise<string> {
  return computeSetHash(dataset.tables.map(table => Buffer.from(table.filename)));
}

export function sampleDataset(): Dataset {
  return {
    tables: getSample(),
    dirname: "sample",
  }
}

export async function archive(dataset: Dataset, dirname?: string): Promise<Blob> {
  const zip = new JSZip();
  const dir = zip.folder(dirname ?? dataset.dirname);
  for (const table of dataset.tables) {
    dir?.file(path.basename(table.filename), JSON.stringify(table.data, undefined, 4));
  }
  return zip.generateAsync({ type: "blob" });
}
