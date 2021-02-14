import { Data, Interest } from "@ndn/packet";
import { Decoder, Encoder } from "@ndn/tlv";

import { DataStore } from 'ndnts-svs';
import * as localforage from 'localforage';

export class ForageDataStore implements DataStore {
    public readonly store: LocalForage;

    constructor(
        name: string,
    ) {
        this.insert = this.insert.bind(this);
        this.find = this.find.bind(this);
        this.store = localforage.createInstance({ name });
    }

    public async insert(data: Data): Promise<void> {
        await this.store.setItem(data.name.toString(), Encoder.encode(data));
    }

    public async find(interest: Interest): Promise<Data | undefined> {
        const wire: Uint8Array = await this.store.getItem(interest.name.toString());
        if (!wire) return undefined;
        return new Decoder(wire).decode(Data);
    }
}