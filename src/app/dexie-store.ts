import { Data, Interest, Name } from "@ndn/packet";
import { Decoder, Encoder, NNI } from "@ndn/tlv";

import { DataStore } from 'ndnts-svs';
import { Dexie } from 'dexie';

export interface StoreEntry {
    id?: number;
    name: string;
    blob?: Uint8Array;
    message: string;
    time: number;
    nid: string;
    seq: number;
};

export class DataInterface {
    public static parseData(data: Data): StoreEntry {
        const msgJsonStr = new TextDecoder().decode(data.content);
        let msgObj = {
            m: msgJsonStr,
            t: 0,
        };

        try {
            msgObj = JSON.parse(msgJsonStr);
        } catch {
            msgObj.t = new Date().getTime();
        }

        return {
            name: data.name.toString(),
            blob: Encoder.encode(data),
            message: msgObj.m,
            time: msgObj.t,
            nid: data.name.get(-2).text,
            seq: NNI.decode(data.name.get(-1).value),
        };
    }

    public static makeData(opts: { msg: string }): Uint8Array {
        const obj = {
            m: opts.msg,
            t: new Date().getTime(),
        };
        return new TextEncoder().encode(JSON.stringify(obj));
    }
}

export class DexieDataStore implements DataStore {
    public readonly db: Dexie;
    public static readonly TABLE = 'chat';

    constructor(
        name: string,
    ) {
        this.insert = this.insert.bind(this);
        this.find = this.find.bind(this);
        this.findByName = this.findByName.bind(this);

        this.db = new Dexie(name);
        this.db.version(3).stores({
            chat: 'name,time',
            meta: 'key',
        });
    }

    public async insert(data: Data): Promise<void> {
        const obj = DataInterface.parseData(data);
        await this.db.table(DexieDataStore.TABLE).put(obj, obj.name);
    }

    public async find(interest: Interest): Promise<Data | undefined> {
        return this.findByName(interest.name);
    }

    public async findByName(name: Name): Promise<Data | undefined> {
        const wire: StoreEntry = await this.db.table(DexieDataStore.TABLE)
            .where('name').equals(name.toString()).first();
        if (!wire) return undefined;
        return new Decoder(wire.blob).decode(Data);
    }
}