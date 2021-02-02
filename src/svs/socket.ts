import { Endpoint, Producer } from "@ndn/endpoint";
import { FwFace } from "@ndn/fw";
import { TT, Component, Data, Interest, Name } from "@ndn/packet";
import { Encoder, NNI } from "@ndn/tlv";
import { Logic } from "./logic";
import * as t from './types';

export class Socket {
    private m_endpoint: Endpoint;
    private m_syncPrefix: Name;
    private m_dataPrefix: Name;
    private m_id: t.NodeID;
    private m_registeredDataPrefix: Producer;
    private m_ims: { [key: string]: Data; } = {};
    private m_logic: Logic;

    constructor(
        syncPrefix: Name,
        id: t.NodeID,
        private m_face: FwFace,
        private m_updateCallback: t.UpdateCallback,
        private m_signingId = new Name(),
    ) {
        // Bind async functions
        this.onDataInterest = this.onDataInterest.bind(this);

        // Initialize
        this.m_endpoint = new Endpoint({ fw: m_face.fw });
        this.m_syncPrefix = new Name(syncPrefix).append('s');
        this.m_dataPrefix = new Name(syncPrefix).append('d');
        this.m_id = escape(id);

        // Create Logic
        this.m_logic = new Logic(
            this.m_face, this.m_syncPrefix, m_updateCallback,
            m_signingId, this.m_id);

        // Register data prefix
        this.m_face.addRoute(this.m_dataPrefix);
        this.m_registeredDataPrefix = this.m_endpoint.produce(this.m_dataPrefix, this.onDataInterest);
    }

    private async onDataInterest(interest: Interest) {
        return this.m_ims[interest.name.toString()] || undefined;
    }

    public publishData(content: Uint8Array, freshness: number, seqNo: t.SeqNo = -1): void {
        const data = new Data();
        data.content = content;
        data.freshnessPeriod = freshness;

        if (seqNo < 0)
            seqNo = this.m_logic.getSeqNo(this.m_id) + 1;

        let encoder = new Encoder();
        encoder.encode(NNI(seqNo));

        data.name = new Name(this.m_dataPrefix)
                    .append(this.m_id)
                    .append(new Component(TT.GenericNameComponent, encoder.output));

        this.m_ims[data.name.toString()] = data;
        this.m_logic.updateSeqNo(seqNo, this.m_id);
    }
}
