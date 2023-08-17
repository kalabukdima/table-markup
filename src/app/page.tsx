"use client"

import React, { useEffect } from "react";
import { Property as CssProperties } from "csstype";
import { strict as assert } from "assert";

import {
  Paper, Table, TableBody, TableRow, TableCell, TableContainer, ThemeProvider, AppBar, Box, Toolbar, Typography, IconButton,
  Pagination, FormGroup, PaginationItem, useMediaQuery, useTheme, ToggleButtonGroup, ToggleButton,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2"
import { createTheme } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import TableRowsIcon from "@mui/icons-material/TableRows";
import AppsIcon from "@mui/icons-material/Apps";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import AddIcon from '@mui/icons-material/Add';

import Spacer from "@/components/Spacer";
import TableColumnsIcon from "@/components/TableColumnsIcon";
import { Point, fillRectangle } from "@/lib/matrix";
import { FilledTableData, CellType, TableType, isMarkedUp } from "@/lib/tables";
import DatasetLoader from "@/lib/storage";
import { getParamsFromUrl, saveParamsToUrl } from "@/lib/params";
import { Dataset, computeDatasetHash, sampleDataset } from "@/lib/dataset";
import { openDatasetFromDisk, saveDatasetToDisk } from "@/lib/filesystem";


const theme = createTheme();

function cellColor(type: CellType): CssProperties.Color {
  if (!type) {
    return "default";
  }
  return {
    "header": "lightsteelblue",
    "attributes": "#f3e8ff",
    "data": "#dcfce7",
    "metadata": "lightgoldenrodyellow",
  }[type];
}

const cellTypes = ["header", "attributes", "data", "metadata"] as const;

type PageStatus = {
  done: boolean;
}

function Header(props: {
  pages: PageStatus[],
  currentPage: number,
  setPage: (x: number) => void,
  download: () => void,
  upload: () => void,
}) {
  const theme = useTheme();
  const small = useMediaQuery(theme.breakpoints.down("sm"), { defaultMatches: true });
  const medium = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          sx={{ mr: 2 }}
          onClick={props.upload}
        >
          <AddIcon />
        </IconButton>
        <Pagination
          page={props.currentPage} count={props.pages.length}
          onChange={(_event, value) => props.setPage(value)}
          siblingCount={small ? 1 : medium ? 2 : 6} boundaryCount={1} shape="rounded"
          sx={{
            // For some reason the PaginationItem style below doesn't affect ellipsis
            ".MuiPaginationItem-ellipsis": {
              color: "inherit",
            },
            "& *": { flexWrap: "nowrap" },
            overflow: "auto",
          }}
          renderItem={item => (
            <PaginationItem {...item} sx={{
              color: item.type === "page" && item.page && (props.pages[item.page - 1]?.done ?? false) ? theme.palette.text.disabled : "inherit"
            }} />
          )}
        />
        <Spacer />
        <IconButton color="inherit" onClick={props.download}><FileDownloadIcon /></IconButton>
      </Toolbar>
    </AppBar>
  )
}

function TableViewer(props: {
  tableData: FilledTableData,
  setAnnotations: (annotations: CellType[][]) => void,
  paintType: string,
}) {
  const [selection, setSelection] = React.useState<{
    start: Point | undefined,
    end: Point | undefined,
  }>({
    start: undefined,
    end: undefined
  })

  const annotations = props.tableData.annotations;
  const paintType = {
    "header": "header",
    "attributes": "attributes",
    "data": "data",
    "metadata": "metadata",
    "clear": undefined,
  }[props.paintType] as CellType;

  const setSelectionStart = (x: number, y: number) => {
    setSelection({
      start: { x, y },
      end: { x, y },
    })
  };
  const setSelectionEnd = (x: number, y: number) => {
    setSelection({
      start: selection.start,
      end: { x, y },
    })
  };
  const clearSelection = () => {
    setSelection({ start: undefined, end: undefined });
  }
  const confirmSelection = () => {
    if (selection.start && selection.end) {
      props.setAnnotations(fillRectangle(annotations, [selection.start, selection.end], paintType));
    }
    clearSelection();
  };

  const visibleAnnotations = (!selection.start || !selection.end) ? annotations : fillRectangle(
    annotations, [selection.start, selection.end], paintType
  );

  return (
    <TableContainer
      component={Paper} sx={{ maxWidth: "fit-content" }}
      onMouseUp={confirmSelection}
    >
      <Table>
        <TableBody>
          {props.tableData.table_array.map((row, row_index) => (
            <TableRow
              key={row_index}
              sx={{
                "& > td": {
                  borderRight: "1px solid",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                },
                "&:last-child > td": { borderBottom: 0 }
              }}
            >
              {row.map((text, cell_index) => (
                <TableCell
                  key={cell_index}
                  sx={{
                    background: cellColor(visibleAnnotations[row_index][cell_index])
                  }}
                  onMouseDown={e => {
                    e.preventDefault();
                    if (e.button === 0) { // primary button
                      setSelectionStart(row_index, cell_index);
                    } else {
                      clearSelection();
                    }
                  }}
                  onMouseEnter={e => {
                    if (e.buttons & 1) { // primary button
                      setSelectionEnd(row_index, cell_index)
                    } else {
                      // mouseup happened outside the table
                      confirmSelection();
                    }
                  }}
                >
                  {text}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function TablePage(props: {
  table: FilledTableData,
  setTableData: (newData: FilledTableData) => void,
  setTableDataAndProceed: (newData: FilledTableData) => void,
}) {
  const [paintType, setPaintType] = React.useState(cellTypes[0]);

  const setAnnotations = (newValue: CellType[][]) => {
    props.setTableData({
      ...props.table,
      annotations: newValue,
    });
  };
  const setHeaderType = (rawValue: string) => {
    const newValue = rawValue ?? "other";
    props.setTableDataAndProceed({
      ...props.table,
      header_type: newValue as TableType,
    });
  };

  return (
    <Box padding={4}>
      <FormGroup>
        <Grid container spacing={2} alignItems={"stretch"} width={1}>
          <Grid width="100%">
            <TableViewer
              tableData={props.table}
              setAnnotations={setAnnotations}
              paintType={paintType}
            />
          </Grid>
          <Grid>
            <ToggleButtonGroup
              value={paintType}
              onChange={(_e, value) => setPaintType(value)}
              exclusive
              color="primary"
              orientation="vertical"
            >
              {cellTypes.map(value =>
                <ToggleButton
                  value={value}
                  sx={{
                    justifyContent: "left",
                    textTransform: "inherit",
                  }} >
                  <Typography component="span" fontFamily="monospace" variant="body1">{value}</Typography>
                </ToggleButton>
              )}
            </ToggleButtonGroup>
          </Grid>
          <Grid>
            <ToggleButtonGroup
              value={props.table.header_type}
              onChange={(_e, value) => setHeaderType(value)}
              exclusive
              color="primary"
            >
              <ToggleButton value="horizontal" >
                <TableRowsIcon />
              </ToggleButton>
              <ToggleButton value="vertical" >
                <TableColumnsIcon />
              </ToggleButton>
              <ToggleButton value="matrix" >
                <AppsIcon />
              </ToggleButton>
              <ToggleButton value="trash">
                <QuestionMarkIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </FormGroup>
    </Box>
  )
}

export function DatasetPage(props: {
  dataset: Dataset,
  saveTable: (index: number, data: FilledTableData) => void,
  page: number,
  setPage: (page: number) => void,
  saveAndDownload: (index: number, data: FilledTableData) => void,
  upload: () => void,
}) {
  const tableIndex = props.page - 1;
  const [currentTable, setCurrentTable] = React.useState(props.dataset.tables[tableIndex].data);
  const pages = props.dataset.tables.map(table => ({ done: isMarkedUp(table.data) }));

  const changePage = (newPage: number) => {
    props.saveTable(tableIndex, currentTable);
    props.setPage(newPage);
  }

  // Ugly but working
  document.onkeydown = e => {
    if (!e.repeat) {
      if (e.key == "ArrowRight") {
        changePage(props.page % pages.length + 1);
      } else if (e.key == "ArrowLeft") {
        changePage((props.page + pages.length - 2) % pages.length + 1);
      }
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Header
        pages={pages} currentPage={props.page} setPage={changePage}
        download={() => {
          props.saveAndDownload(tableIndex, currentTable);
        }}
        upload={props.upload}
      />
      <TablePage
        table={currentTable}
        setTableData={setCurrentTable}
        setTableDataAndProceed={newData => {
          props.saveTable(tableIndex, newData);
          props.setPage(props.page % pages.length + 1);
          // In case there is only one table it should be redrawn correctly
          setCurrentTable(newData);
        }}
      />
    </ThemeProvider>
  )
}

export default function App() {
  const [datasetHash, setDatasetHash] = React.useState<string>();
  const [db, setDb] = React.useState<DatasetLoader>();
  const [dataset, setDataset] = React.useState<Dataset>();
  const [page, setPage] = React.useState(1);
  const [isNotFound, setNotFound] = React.useState(false);

  useEffect(() => {
    (async () => {
      const params = getParamsFromUrl();
      let db, hash, dataset;
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
      if (dataset) {
        setDb(db);
        setDataset(dataset);
        setDatasetHash(hash);
        setPage(params.page ?? 1);
      } else {
        setNotFound(true);
      }
    })();
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
        />
      }
      {isNotFound &&
        <h3>
          <Typography align="center" variant="h4">
            Dataset not found
          </Typography>
        </h3>
      }
    </>
  )
}
