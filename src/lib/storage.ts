import { openDB, IDBPDatabase, DBSchema } from "idb/with-async-ittr";
import { FilledTableData } from "./tables";
import { Dataset } from "./dataset";

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
    metadata: {
        key: [string];
        value: {
            datasetId: string;
            metadata: {
                dirname: string;
            }
        }
    }
}

export default class DatasetLoader {
    private db!: IDBPDatabase<DatasetDB>;

    private constructor(
        private readonly datasetId: string
    ) { }

    static async withId(datasetId: string): Promise<DatasetLoader> {
        const result = new DatasetLoader(datasetId);
        await result.initialize();
        return result;
    }

    async initialize() {
        this.db = await openDB<DatasetDB>("datasets", 1, {
            upgrade(db) {
                db.createObjectStore("lastState", {
                    keyPath: ["datasetId", "tableIndex"]
                });
                db.createObjectStore("metadata", {
                    keyPath: ["datasetId"],
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

    public async loadDataset(): Promise<Dataset | undefined> {
        const tx = this.db.transaction(["lastState", "metadata"], "readonly");
        const result = [];
        const metadataPromise = tx.objectStore("metadata").get([this.datasetId]);
        for await (const cursor of tx.objectStore("lastState").iterate(IDBKeyRange.lowerBound([this.datasetId, 0]))) {
            if (cursor.value.datasetId != this.datasetId) {
                break;
            }
            result.push(cursor.value.table);
        }
        const metadata = await metadataPromise;
        await tx.done;
        if (result.length == 0 || metadata === undefined) {
            return undefined
        }
        return {
            ...metadata.metadata,
            tables: result,
        };
    }

    public async loadDatasetOrDefault(fallback: () => Dataset): Promise<Dataset> {
        const result = await this.loadDataset();
        if (!result) {
            const dataset = fallback();
            await this.saveDataset(dataset);
            return dataset;
        } else {
            return result;
        }
    }

    public async saveTable(tableIndex: number, newValue: FilledTableData): Promise<void> {
        await this.db.put("lastState", {
            datasetId: this.datasetId,
            tableIndex,
            table: newValue,
        });
    }

    public async saveDataset(dataset: Dataset): Promise<void> {
        const tx = this.db.transaction("lastState", "readwrite");
        await Promise.all(dataset.tables.map((table, index) => tx.store.put({
            datasetId: this.datasetId,
            tableIndex: index,
            table,
        })));
        await tx.done;
    }
}
