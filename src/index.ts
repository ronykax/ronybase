import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

export class RonyBase<T = any> {
    private dbDir: string;
    private collections: Map<string, T[]> = new Map();

    constructor() {
        this.dbDir = path.resolve(process.cwd(), "db");
        if (!existsSync(this.dbDir)) mkdirSync(this.dbDir);
    }

    private getFilePath(collection: string) {
        return path.join(this.dbDir, `${collection}.json`);
    }

    async load(collection: string) {
        const file = this.getFilePath(collection);
        if (!existsSync(file)) {
            writeFileSync(file, "[]", "utf8");
        }
        const data = JSON.parse(readFileSync(file, "utf8"));
        this.collections.set(collection, data);
    }

    private save(collection: string) {
        const file = this.getFilePath(collection);
        const data = this.collections.get(collection) || [];
        writeFileSync(file, JSON.stringify(data, null, 2));
    }

    async insert(collection: string, item: T) {
        if (!this.collections.has(collection)) await this.load(collection);
        const data = this.collections.get(collection)!;
        data.push(item);
        this.save(collection);
    }

    async getAll(collection: string): Promise<T[]> {
        if (!this.collections.has(collection)) await this.load(collection);
        return this.collections.get(collection)!;
    }

    async find(
        collection: string,
        predicate: (item: T) => boolean
    ): Promise<T[]> {
        if (!this.collections.has(collection)) await this.load(collection);
        return this.collections.get(collection)!.filter(predicate);
    }

    async update(
        collection: string,
        predicate: (item: T) => boolean,
        newValues: Partial<T>
    ) {
        if (!this.collections.has(collection)) await this.load(collection);
        const updated = this.collections
            .get(collection)!
            .map((item) =>
                predicate(item) ? { ...item, ...newValues } : item
            );
        this.collections.set(collection, updated);
        this.save(collection);
    }

    async delete(collection: string, predicate: (item: T) => boolean) {
        if (!this.collections.has(collection)) await this.load(collection);
        const filtered = this.collections
            .get(collection)!
            .filter((item) => !predicate(item));
        this.collections.set(collection, filtered);
        this.save(collection);
    }
}
