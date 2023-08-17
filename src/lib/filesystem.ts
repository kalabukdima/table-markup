import { directoryOpen, fileSave, FileWithDirectoryAndFileHandle } from "browser-fs-access";
import { FilledTableData } from "@/lib/tables";
import { archive, Dataset } from "@/lib/dataset";
import path from "path";

export async function saveDatasetToDisk(dataset: Dataset, id: string) {
  const blob = archive(dataset, dataset.dirname + "_out");
  fileSave(blob, {
    fileName: `${id}.zip`,
    extensions: [".zip"],
    id: id,
  });
}

export async function openDatasetFromDisk(): Promise<Dataset> {
  const files = (await directoryOpen({
    recursive: false,
    mode: "read",
  })) as FileWithDirectoryAndFileHandle[];
  if (files.length == 0) {
    throw new Error("No files selected");
  }

  const tables = await Promise.all(files.map(async (file) => {
    const text = await file.text();
    const data = JSON.parse(text) as FilledTableData;
    return { data, filename: file.name };
  }));
  const dirname = path.basename(path.dirname(files[0].webkitRelativePath));
  const dataset: Dataset = { tables, dirname };
  return dataset;
}
