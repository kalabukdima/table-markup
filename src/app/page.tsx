"use client"

import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ThemeProvider, styled, tableCellClasses,
  AppBar, Box, Toolbar, Typography, IconButton, Pagination, Container, Select, MenuItem, InputLabel, FormControl, ButtonGroup, Button, Checkbox, Radio, FormGroup, PaginationItem, useMediaQuery
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2"
import { createTheme } from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import TableRowsIcon from "@mui/icons-material/TableRows";
import AppsIcon from "@mui/icons-material/Apps";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";


const theme = createTheme();

function Spacer() {
  return <Box margin="auto" />;
}

function Header() {
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
          count={100}
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

function TableViewer() {
  return (
    <TableContainer component={Paper} sx={{ maxWidth: "fit-content" }}>
      <Table>
        <TableBody>
          {[...Array(5).keys()].map((x) => (
            <TableRow
              key={x}
              sx={{
                "& > td": {
                  borderRight: "1px solid",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                },
                "&:last-child > td": { borderBottom: 0 }
              }}
            >
              {[...Array(5).keys()].map((y) => (
                <TableCell key={y}>
                  {[...Array(y * 4 + 1)].map(_ => x.toString())}
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
  return (
    <ThemeProvider theme={theme}>
      <Header />
      <Box padding={4}>
        <FormGroup>
          <Grid container spacing={2} alignItems={"stretch"} width={1}>
            <Grid width="100%">
              <TableViewer />
            </Grid>
            <Grid>
              <Select
                id="cell-type-select"
                value="header"
              >
                <MenuItem value="header">Header</MenuItem>
                <MenuItem value="attributes">Attributes</MenuItem>
                <MenuItem value="data">Data</MenuItem>
                <MenuItem value="metadata">Metadata</MenuItem>
              </Select>
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
