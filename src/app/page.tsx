"use client"

import React from "react";
import { Property as CssProperties } from "csstype";

import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ThemeProvider, AppBar, Box, Toolbar, Typography,
  IconButton, Pagination, ButtonGroup, Button, Radio, FormGroup, PaginationItem, useMediaQuery, TextField, RadioGroup,
  FormControlLabel
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2"
import { createTheme } from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import TableRowsIcon from "@mui/icons-material/TableRows";
import AppsIcon from "@mui/icons-material/Apps";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";

import { Point, fillRectangle } from "@/lib/matrix";
import { FilledTableData, samples, CellType } from "@/lib/data";

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    pressed: true;
  }
}

const theme = createTheme();

function cellColor(type: CellType): CssProperties.Color {
  if (type === undefined) {
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

function Header({ count, page, setPage }: { count: number, page: number, setPage: (x: number) => void }) {
  const small = useMediaQuery(theme.breakpoints.down("sm"), { defaultMatches: true });
  const medium = useMediaQuery(theme.breakpoints.down("md"));

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

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
          page={page} count={count}
          onChange={handlePageChange}
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
              color: item.page === 5 && item.type === "page" ? "darkgray" : "inherit"
            }} />
          )}
        />
        <Spacer />
        <IconButton color="inherit"><FileDownloadIcon /></IconButton>
      </Toolbar>
    </AppBar>
  )
}

function TableViewer(props: Pick<FilledTableData, "table_array" | "annotations"> & {
  paintType: CellType,
}) {
  const [selection, setSelection] = React.useState<{
    start: Point | undefined,
    end: Point | undefined,
  }>({
    start: undefined,
    end: undefined
  })

  const [annotations, setAnnotations] = React.useState(props.annotations);

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
      setAnnotations(fillRectangle(annotations, [selection.start, selection.end], props.paintType));
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
          {props.table_array.map((row, row_index) => (
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

export default function DataView() {
  const [page, setPage] = React.useState(1);
  const [paintType, setPaintType] = React.useState<CellType>("header");
  return (
    <ThemeProvider theme={theme}>
      <Header count={samples.length} page={page} setPage={setPage} />
      <Box padding={4}>
        <FormGroup>
          <Grid container spacing={2} alignItems={"stretch"} width={1}>
            <Grid width="100%">
              <TableViewer
                {...samples[0]}
                paintType={paintType}
              />
            </Grid>
            <Grid>
              <RadioGroup
                name="controlled-radio-buttons-group"
                value={paintType}
                onChange={e => setPaintType(e.target.value as CellType)}
              >
                <FormControlLabel value="header" control={<Radio />} label="Header" />
                <FormControlLabel value="attributes" control={<Radio />} label="Attributes" />
                <FormControlLabel value="data" control={<Radio />} label="Data" />
                <FormControlLabel value="metadata" control={<Radio />} label="Metadata" />
              </RadioGroup>
            </Grid>
            <Grid>
              <ButtonGroup variant="contained">
                <IconButton size="large" color="primary"><TableRowsIcon /></IconButton>
                <IconButton size="large"><TableColumnsIcon /></IconButton>
                <IconButton size="large"><AppsIcon /></IconButton>
                <IconButton size="large"><QuestionMarkIcon /></IconButton>
              </ButtonGroup>
            </Grid>
          </Grid>
        </FormGroup>
      </Box>
    </ThemeProvider>
  )
}
