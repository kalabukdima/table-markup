"use client"

import React from "react";
import { Property as CssProperties } from "csstype";

import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ThemeProvider, AppBar, Box, Toolbar, Typography,
  IconButton, Pagination, ButtonGroup, Button, Radio, FormGroup, PaginationItem, useMediaQuery, TextField, RadioGroup,
  FormControlLabel,
  useTheme
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2"
import { createTheme } from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import TableRowsIcon from "@mui/icons-material/TableRows";
import AppsIcon from "@mui/icons-material/Apps";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";

import { Point, fillRectangle } from "@/lib/matrix";
import { FilledTableData, samples, CellType, TableType } from "@/lib/data";

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    pressed: true;
  }
}

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

function Spacer() {
  return <Box margin="auto" />;
}

type PageStatus = {
  done: boolean;
}

function Header(props: {
  pages: PageStatus[],
  currentPage: number,
  setPage: (x: number) => void,
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
          aria-label="menu"
          sx={{ mr: 2 }}
        >
          <HomeIcon />
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
        <IconButton color="inherit"><FileDownloadIcon /></IconButton>
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

function TableColumnsIcon() {
  return <TableRowsIcon sx={{ rotate: "90deg" }} />
}

type Dataset = {
  tables: FilledTableData[];
}

function isMarkedUp(table: FilledTableData): boolean {
  if (table.header_type != "other") {
    return true;
  }
  if (!table.annotations) {
    return false;
  }
  return table.annotations.find(row => (row.find(x => x) != undefined)) != undefined
}

export default function DataView() {
  const [dataset, setDataset] = React.useState<Dataset>({ tables: samples });
  const [page, setPage] = React.useState(1);
  const tableIndex = page - 1;
  const table = dataset.tables[tableIndex];
  if (table.header_type == undefined) {
    table.header_type = "other";
  }
  const [paintType, setPaintType] = React.useState("header");

  const setTableData = (newData: FilledTableData) => {
    const newTables = dataset.tables.map((data, index) => index == tableIndex ? newData : data);
    setDataset({
      tables: newTables,
    });
  };
  const setAnnotations = (newValue: CellType[][]) => {
    setTableData({
      ...table,
      annotations: newValue,
    });
  };
  const setHeaderType = (newValue: string) => {
    setTableData({
      ...table,
      header_type: newValue as TableType,
    })
  };

  return (
    <ThemeProvider theme={theme}>
      <Header pages={dataset.tables.map(table => ({ done: isMarkedUp(table) }))} currentPage={page} setPage={setPage} />
      <Box padding={4}>
        <FormGroup>
          <Grid container spacing={2} alignItems={"stretch"} width={1}>
            <Grid width="100%">
              <TableViewer
                key={tableIndex}
                tableData={table}
                setAnnotations={setAnnotations}
                paintType={paintType}
              />
            </Grid>
            <Grid>
              <RadioGroup
                value={paintType}
                onChange={e => setPaintType(e.target.value)}
              >
                <FormControlLabel value="header" control={<Radio />} label="Header" />
                <FormControlLabel value="attributes" control={<Radio />} label="Attributes" />
                <FormControlLabel value="data" control={<Radio />} label="Data" />
                <FormControlLabel value="metadata" control={<Radio />} label="Metadata" />
                <FormControlLabel value="clear" control={<Radio />} label="Clear" />
              </RadioGroup>
            </Grid>
            <Grid>
              <RadioGroup
                value={table.header_type}
                onChange={e => setHeaderType(e.target.value)}
              >
                <FormControlLabel value="horizontal" control={<Radio/>} label={<TableRowsIcon />} />
                <FormControlLabel value="vertical" control={<Radio/>} label={<TableColumnsIcon />} />
                <FormControlLabel value="matrix" control={<Radio/>} label={<AppsIcon />} />
                <FormControlLabel value="trash" control={<Radio/>} label={<QuestionMarkIcon />} />
                <FormControlLabel value="other" control={<Radio/>} label="Unset" />
              </RadioGroup>
              {/* <ButtonGroup variant="contained">
                <IconButton size="large" color="primary"><TableRowsIcon /></IconButton>
                <IconButton size="large"><TableColumnsIcon /></IconButton>
                <IconButton size="large"><AppsIcon /></IconButton>
                <IconButton size="large"><QuestionMarkIcon /></IconButton>
              </ButtonGroup> */}
            </Grid>
          </Grid>
        </FormGroup>
      </Box>
    </ThemeProvider>
  )
}
