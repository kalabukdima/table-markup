"use client";
import React from "react";
import {
  Paper, Table, TableBody, TableRow, TableCell, TableContainer, ThemeProvider, AppBar, Box, Toolbar, Typography, IconButton,
  Pagination, FormGroup, PaginationItem, useMediaQuery, useTheme, ToggleButtonGroup, ToggleButton
} from "@mui/material";
import { ColorPicker } from "material-ui-color";
import Grid from "@mui/material/Unstable_Grid2";
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
import { Dataset } from "@/lib/dataset";

const theme = createTheme();

const cellTypes = ["header", "attributes", "data", "metadata"] as const;

type PageStatus = {
  done: boolean;
};

function Header(props: {
  pages: PageStatus[];
  currentPage: number;
  setPage: (x: number) => void;
  download: () => void;
  upload: () => void;
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
          )} />
        <Spacer />
        <IconButton color="inherit" onClick={props.download}><FileDownloadIcon /></IconButton>
      </Toolbar>
    </AppBar>
  );
}

function TableViewer(props: {
  tableData: FilledTableData;
  setAnnotations: (annotations: CellType[][]) => void;
  paintType: CellType;
  colors: Record<string, string>;
}) {
  const [selection, setSelection] = React.useState<{
    start: Point | undefined;
    end: Point | undefined;
  }>({
    start: undefined,
    end: undefined
  });

  const annotations = props.tableData.annotations;

  const setSelectionStart = (x: number, y: number) => {
    setSelection({
      start: { x, y },
      end: { x, y },
    });
  };
  const setSelectionEnd = (x: number, y: number) => {
    setSelection({
      start: selection.start,
      end: { x, y },
    });
  };
  const clearSelection = () => {
    setSelection({ start: undefined, end: undefined });
  };
  const confirmSelection = () => {
    if (selection.start && selection.end) {
      props.setAnnotations(fillRectangle(annotations, [selection.start, selection.end], props.paintType));
    }
    clearSelection();
  };

  const visibleAnnotations = (!selection.start || !selection.end) ? annotations : fillRectangle(
    annotations, [selection.start, selection.end], props.paintType
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
                    background: props.colors[visibleAnnotations[row_index][cell_index] ?? ""] ?? "white"
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
                      setSelectionEnd(row_index, cell_index);
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
  );
}

function TablePage(props: {
  table: FilledTableData;
  setTableData: (newData: FilledTableData) => void;
  setTableDataAndProceed: (newData: FilledTableData) => void;
  colors: Record<string, string>;
  setColors: (color: Record<string, string>) => void;
}) {
  const [paintType, setPaintType] = React.useState<CellType>(cellTypes[0]);

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
              colors={props.colors} />
          </Grid>
          <Grid>
            <ToggleButtonGroup
              value={paintType}
              onChange={(_e, value) => setPaintType(value)}
              exclusive
              color="primary"
              orientation="vertical"
            >
              {cellTypes.map(value => <ToggleButton
                value={value}
                sx={{
                  justifyContent: "left",
                  textTransform: "inherit",
                }}>
                <ColorPicker
                  disableAlpha hideTextfield
                  value={props.colors[value]}
                  onChange={color => {
                    props.setColors({ ...props.colors, [value]: color.css.backgroundColor ?? "white" });
                  }}
                ></ColorPicker>
                <Typography component="span" fontFamily="monospace" variant="body1" sx={{ marginLeft: 1 }}>
                  {value}
                </Typography>
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
              <ToggleButton value="horizontal">
                <TableRowsIcon />
              </ToggleButton>
              <ToggleButton value="vertical">
                <TableColumnsIcon />
              </ToggleButton>
              <ToggleButton value="matrix">
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
  );
}

export function DatasetPage(props: {
  dataset: Dataset;
  saveTable: (index: number, data: FilledTableData) => void;
  page: number;
  setPage: (page: number) => void;
  saveAndDownload: (index: number, data: FilledTableData) => void;
  upload: () => void;
  colors: Record<string, string>;
  setColors: (color: Record<string, string>) => void;
}) {
  const tableIndex = props.page - 1;
  const [currentTable, setCurrentTable] = React.useState(props.dataset.tables[tableIndex].data);
  const pages = props.dataset.tables.map(table => ({ done: isMarkedUp(table.data) }));

  const changePage = (newPage: number) => {
    props.saveTable(tableIndex, currentTable);
    props.setPage(newPage);
  };

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
        upload={props.upload} />
      <TablePage
        table={currentTable}
        colors={props.colors}
        setColors={props.setColors}
        setTableData={setCurrentTable}
        setTableDataAndProceed={newData => {
          props.saveTable(tableIndex, newData);
          props.setPage(props.page % pages.length + 1);
          // In case there is only one table it should be redrawn correctly
          setCurrentTable(newData);
        }} />
    </ThemeProvider>
  );
}
