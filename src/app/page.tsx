"use client"

import React, { useEffect } from "react";
import { strict as assert } from "assert";

import {
  Typography
} from "@mui/material";

import { FilledTableData } from "@/lib/tables";
import DatasetLoader from "@/lib/storage";
import { getParamsFromUrl, saveParamsToUrl } from "@/lib/params";
import { Dataset, computeDatasetHash, sampleDataset } from "@/lib/dataset";
import { openDatasetFromDisk, saveDatasetToDisk } from "@/lib/filesystem";
import { DatasetPage } from "@/components/DatasetPage";

const cellColors = {
  "header": "lightsteelblue",
  "attributes": "#f3e8ff",
  "data": "#dcfce7",
  "metadata": "lightgoldenrodyellow",
};

export default function App() {
  const [datasetHash, setDatasetHash] = React.useState<string>();
  const [db, setDb] = React.useState<DatasetLoader>();
  const [dataset, setDataset] = React.useState<Dataset>();
  const [page, setPage] = React.useState(1);
  const [isNotFound, setNotFound] = React.useState(false);
  const [colors, setColors] = React.useState<Record<string, string>>(cellColors);

  useEffect(() => {
    (async () => {
      const params = getParamsFromUrl();
      let db, hash, dataset;
      try {
        if (params.datasetHash) {
          hash = params.datasetHash;
          db = await DatasetLoader.withId(hash);
          dataset = await db.loadDataset();
          console.log(`Loaded dataset ${hash}:`, dataset);
        } else {
          dataset = sampleDataset();
          hash = await computeDatasetHash(dataset);
          db = await DatasetLoader.withId(hash);
          await db.saveDataset(dataset);
        }
      } catch (e) {
        console.error(e);
      }
      if (dataset) {
        setDb(db);
        setDataset(dataset);
        setDatasetHash(hash);
        setPage(params.page ?? 1);
      } else {
        setNotFound(true);
      }
    })();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
    };
  }, []);

  useEffect(() => {
    if (datasetHash) {
      saveParamsToUrl({ page, datasetHash });
    }
  }, [datasetHash, page]);

  const updateDataset = (tableIndex: number, newTable: FilledTableData): Dataset => {
    assert(db != undefined);
    assert(dataset != undefined);

    db.saveTable(tableIndex, newTable)
      .catch(console.error);

    const newTables = dataset.tables.map(
      (table, i) => i == tableIndex ? { data: newTable, filename: table.filename } : table
    );
    return {
      ...dataset,
      tables: newTables,
    };
  }
  const saveTable = (index: number, newData: FilledTableData) => {
    setDataset(updateDataset(index, newData));
  };

  const saveAndDownload = (index: number, data: FilledTableData) => {
    assert(datasetHash != undefined);
    const dataset = updateDataset(index, data);
    setDataset(dataset);
    saveDatasetToDisk(dataset, datasetHash);
  };

  const upload = async () => {
    const uploaded: Dataset = await openDatasetFromDisk();
    const datasetHash = await computeDatasetHash(uploaded);
    const db = await DatasetLoader.withId(datasetHash);
    let dataset = await db.loadDataset();
    if (!dataset) {
      dataset = uploaded;
      await db.saveDataset(uploaded);
    } else {
      console.log("Found saved dataset", datasetHash);
    }

    setDataset(dataset);
    setDatasetHash(datasetHash);
    setDb(db);
    setPage(1);
  };

  return (
    <>
      {dataset &&
        <DatasetPage
          key={`${datasetHash}-${page}`}
          dataset={dataset}
          saveTable={saveTable}
          page={page}
          setPage={setPage}
          saveAndDownload={saveAndDownload}
          upload={upload}
          colors={colors}
          setColors={setColors}
        />
      }
      {isNotFound &&
        <Typography align="center" variant="h3" padding={2}>
          Dataset not found
        </Typography>
      }
    </>
  )
}
