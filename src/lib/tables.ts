import sample0 from "../../data/html_cleaned_fin_06067_0_aug1.json";
import sample1 from "../../data/html_cleaned_fin_06081_0.json";
import sample2 from "../../data/html_cleaned_fin_06081_1.json";
import sample3 from "../../data/html_cleaned_fin_06081_3_aug4.json";
import sample4 from "../../data/html_cleaned_fin_06081_3_aug5.json";
import sample5 from "../../data/html_cleaned_fin_06081_3_aug6.json";

const samples = [sample0, sample1, sample2, sample3, sample4, sample5] as FilledTableData[];

export type CellType = "header" | "attributes" | "data" | "metadata" | undefined;
export type TableType = "vertical" | "horizontal" | "matrix" | "trash" | "other";

export interface TableData {
    directory: string;
    file_name: string;
    num_cols: number;
    num_rows: number;
    table_array: string[][];
    table_id: string | null;
    url: string | null;
};

export interface FilledTableData extends TableData {
    annotations: CellType[][];
    header_type: TableType;
}

export function isMarkedUp(table: FilledTableData): boolean {
    if (table.header_type != "other") {
        return true;
    }
    if (!table.annotations) {
        return false;
    }
    return table.annotations.find(row => (row.find(x => x) != undefined)) != undefined
}

export function getSample() {
    const result = [...samples];
    result.forEach(table => {
        if (table.header_type == undefined) {
            table.header_type = "other";
        }
    });
    return result;
}
