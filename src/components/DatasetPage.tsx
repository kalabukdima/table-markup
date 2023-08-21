"use client";
import React from "react";
import {
  Paper, Table, TableBody, TableRow, TableCell, TableContainer, ThemeProvider, AppBar, Box, Toolbar, Typography, IconButton,
  Pagination, FormGroup, PaginationItem, useMediaQuery, useTheme, ToggleButtonGroup, ToggleButton, Modal
} from "@mui/material";
import { ColorPicker } from "material-ui-color";
import Grid from "@mui/material/Unstable_Grid2";
import { createTheme } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import TableRowsIcon from "@mui/icons-material/TableRows";
import AppsIcon from "@mui/icons-material/Apps";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
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
  showHelp: () => void;
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
        <IconButton color="inherit" onClick={props.showHelp} sx={{ mr: 1 }}><HelpOutlineIcon /></IconButton>
        <IconButton color="inherit" onClick={props.download}><FileDownloadIcon /></IconButton>
      </Toolbar>
    </AppBar>
  );
}

function HelpWindow(props: {
  isOpen: boolean,
  close: () => void,
}) {
  return <Modal open={props.isOpen} onClose={props.close}>
    <Paper sx={{
      margin: "25vh auto 0 auto",
      maxWidth: "30em",
      padding: 4,
    }}>
      <Grid container columnSpacing={1} rowSpacing={1}>
        <Grid xs={12}>
          <Typography variant="h4" marginBottom={2}>
            Keyboard navigation
          </Typography>
        </Grid>
        <Grid xs={2.5}>
          <kbd>←</kbd>/<kbd>→</kbd>
        </Grid>
        <Grid xs={9.5}>
          <Typography>
            Navigate between tables
          </Typography>
        </Grid>
        <Grid xs={2.5}>
          <kbd>Space</kbd>
        </Grid>
        <Grid xs={9.5}>
          <Typography>
            Go to the next not marked page
          </Typography>
        </Grid>
        <Grid xs={2.5}>
          <kbd>Alt</kbd> + click
        </Grid>
        <Grid xs={9.5}>
          <Typography>
            Start editing text in a table cell
          </Typography>
        </Grid>
        <Grid xs={2.5}>
          <kbd>?</kbd>
        </Grid>
        <Grid xs={9.5}>
          <Typography>
            Show this help
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  </Modal>;
}

function TableViewer(props: {
  tableData: FilledTableData;
  setAnnotations: (annotations: CellType[][]) => void;
  setCellContent: (i: number, j: number, text: string) => void;
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
          {props.tableData.table_array.map((row, rowIndex) => (
            <TableRow
              key={rowIndex}
              sx={{
                "& > td": {
                  borderRight: "1px solid",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                },
                "&:last-child > td": { borderBottom: 0 }
              }}
            >
              {row.map((text, cellIndex) => (
                <TableCell
                  key={cellIndex}
                  sx={{
                    background: props.colors[visibleAnnotations[rowIndex][cellIndex] ?? ""] ?? "white"
                  }}
                  onMouseDown={e => {
                    if (e.button === 0) { // primary button
                      if (e.altKey) {
                        e.currentTarget.setAttribute("contenteditable", "true");
                      } else {
                        e.preventDefault();
                        if (document.activeElement && typeof (document.activeElement as any)["blur"] == "function") {
                          (document.activeElement as HTMLElement).blur();
                        }
                        setSelectionStart(rowIndex, cellIndex);
                      }
                    } else {
                      clearSelection();
                    }
                  }}
                  onMouseEnter={e => {
                    if (e.buttons & 1) { // primary button
                      setSelectionEnd(rowIndex, cellIndex);
                    } else {
                      // mouseup happened outside the table
                      confirmSelection();
                    }
                  }}
                  onKeyDown={e => {
                    e.stopPropagation();
                    if (e.key == "Enter" || e.key == "Escape") {
                      e.currentTarget.blur();
                    }
                  }}
                  suppressContentEditableWarning
                  onBlur={e => {
                    e.currentTarget.setAttribute("contenteditable", "false");
                    props.setCellContent(rowIndex, cellIndex, e.currentTarget.innerText);
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
  const setHeaderType = (newValue: string | undefined) => {
    const newTable = {
      ...props.table,
      header_type: (newValue ?? "other") as TableType,
    };
    if (newValue) {
      props.setTableDataAndProceed(newTable);
    } else {
      props.setTableData(newTable);
    }
  };
  const setCellContent = (i: number, j: number, newValue: string) => {
    props.setTableData({
      ...props.table,
      table_array: props.table.table_array.map((row, rowIndex) =>
        row.map((cell, cellIndex) =>
          (rowIndex == i && cellIndex == j) ? newValue : cell
        )
      )
    });
  };

  return (
    <Box padding={4}>
      <FormGroup>
        <Grid container spacing={2} alignItems={"stretch"} width={1}>
          <Grid>
            <Typography variant="h6">
              {props.table.file_name ?? "<unknown>"}
            </Typography>
          </Grid>
          <Grid width="100%">
            <TableViewer
              tableData={props.table}
              setAnnotations={setAnnotations}
              setCellContent={setCellContent}
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
                key={value}
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

// Indexes pages from 0
function nextPendingPage(pages: PageStatus[], currentPage: number): number {
  let result = pages.slice(currentPage + 1).findIndex(page => !page.done);
  if (result != -1) {
    // found index relative to slice start
    result += currentPage + 1;
  } else {
    result = pages.slice(0, currentPage).findIndex(page => !page.done);
  }
  if (result == -1) {
    result = currentPage;
  }
  return result;
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
  const [helpOpen, setHelpOpen] = React.useState(false);
  const pages = props.dataset.tables.map(table => ({ done: isMarkedUp(table.data) }));

  const changePage = (newPage: number) => {
    props.saveTable(tableIndex, currentTable);
    props.setPage(newPage);
  };

  // Ugly but working
  window.onkeydown = e => {
    if (e.code == "ArrowRight") {
      changePage(props.page % pages.length + 1);
    } else if (e.code == "ArrowLeft") {
      changePage((props.page + pages.length - 2) % pages.length + 1);
    } else if (e.code == "Space") {
      changePage(nextPendingPage(pages, tableIndex) + 1);
    } else if (e.key == "?") {
      setHelpOpen(!helpOpen);
    } else if (e.code == "Escape") {
      setHelpOpen(false);
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
        showHelp={() => setHelpOpen(true)}
      />
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
      <HelpWindow
        isOpen={helpOpen}
        close={() => setHelpOpen(false)}
      />
    </ThemeProvider>
  );
}
