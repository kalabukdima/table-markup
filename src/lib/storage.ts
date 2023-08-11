import { openDB, IDBPDatabase, DBSchema } from "idb/with-async-ittr";
import { FilledTableData } from "./tables";

interface DatasetDB extends DBSchema {
    lastState: {
        key: [string, number];
        value: {
            datasetId: string;
            tableIndex: number;
            table: FilledTableData;
        };
        indexes: {
        }
    };
}

export default class DatasetLoader {
    private db!: IDBPDatabase<DatasetDB>;

    private constructor(
        private readonly datasetId: string
    ) { }

    static async forDataset(datasetId: string): Promise<DatasetLoader> {
        const result = new DatasetLoader(datasetId);
        await result.initialize();
        return result;
    }

    async initialize() {
        this.db = await openDB<DatasetDB>("datasets", 1, {
            upgrade(db) {
                const store = db.createObjectStore("lastState", {
                    keyPath: ["datasetId", "tableIndex"]
                });
            },
            terminated: () => {
                this.initialize()
                    .catch(reason => {
                        console.error(reason);
                    })
            }
        });
    }

    public async loadAll(): Promise<FilledTableData[]> {
        const tx = this.db.transaction("lastState", "readonly");
        const result = [];
        for await (const cursor of tx.store.iterate(IDBKeyRange.lowerBound([this.datasetId, 0]))) {
            if (cursor.value.datasetId != this.datasetId) {
                break;
            }
            result.push(cursor.value.table);
        }
        await tx.done;
        return result;
    }

    public async saveOne(tableIndex: number, newValue: FilledTableData): Promise<void> {
        await this.db.put("lastState", {
            datasetId: this.datasetId,
            tableIndex,
            table: newValue,
        });
    }

    public async save(tables: FilledTableData[]): Promise<void> {
        const tx = this.db.transaction("lastState", "readwrite");
        await Promise.all(tables.map((table, index) => tx.store.put({
            datasetId: this.datasetId,
            tableIndex: index,
            table,
        })));
        await tx.done;
    }
}
