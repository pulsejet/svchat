import { FwFace } from "@ndn/fw";
import { Endpoint, Producer } from "@ndn/endpoint"
import { Data, Interest, Name } from "@ndn/packet";
import { VersionVector } from "./version-vector";
import * as t from './types';

export class Logic {
    private m_endpoint: Endpoint;
    private m_vv = new VersionVector();
    private m_syncRegisteredPrefix: Producer;
    private m_retxEvent: any = 0;

    constructor (
        private m_face: FwFace,
        private m_syncPrefix: Name,
        private m_onUpdate: t.UpdateCallback,
        private m_signingId: Name,
        private m_id: t.NodeID
    ) {
        // Bind async functions
        this.onSyncInterest = this.onSyncInterest.bind(this);
        this.sendSyncInterest = this.sendSyncInterest.bind(this);

        // Initialize
        this.m_vv.set(m_id, 0);
        this.m_endpoint = new Endpoint({ fw: m_face.fw });

        // Register sync prefix
        this.m_face.addRoute(this.m_syncPrefix);
        this.m_syncRegisteredPrefix = this.m_endpoint.produce(m_syncPrefix, this.onSyncInterest);

        // Start periodically send sync interest
        this.retxSyncInterest();
    }

    private async onSyncInterest(interest: Interest) {
        console.log('onSyncInterest')
        const encodedVV = interest.name.get(-1)?.tlv as Uint8Array;
        if (!encodedVV) return;

        const vv = VersionVector.from(encodedVV) as VersionVector;
        if (!vv) return;

        return undefined;
    }

    private retxSyncInterest() {
        this.sendSyncInterest();
        clearTimeout(this.m_retxEvent);
        this.m_retxEvent = setTimeout(this.retxSyncInterest.bind(this), 3000);
    }

    private async sendSyncInterest() {
        const syncName = this.m_syncPrefix.append(this.m_vv.encodeToComponent());

        const interest = new Interest(syncName);
        interest.canBePrefix = true;
        interest.mustBeFresh = true;

        let data: Data;
        try {
            data = await this.m_endpoint.consume(interest);
        } catch (err) {
            return;
        }

        // Try decoding the received version vector
        const newVV = VersionVector.from(data.content) as VersionVector;
        if (!newVV) return;
    }

    public updateSeqNo(seq: t.SeqNo, nid: t.NodeID = this.m_id): void {
        const prev = this.m_vv.get(nid);
        this.m_vv.set(nid, seq);

        if (seq > prev)
            this.sendSyncInterest();
    }

    public getSeqNo(nid: t.NodeID = this.m_id) {
        return this.m_vv.get(nid);
    }
}
