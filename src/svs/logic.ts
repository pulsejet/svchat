import { Endpoint, Producer } from "@ndn/endpoint"
import { TT, Component, Data, Interest, Name } from "@ndn/packet";
import { VersionVector } from "./version-vector";
import * as t from './types';

export class Logic {

    private m_vv = new VersionVector();
    private m_syncRegisteredPrefix: Producer;
    private m_retxEvent: any = 0;

    constructor (
        private m_endpoint: Endpoint,
        private m_syncPrefix: Name,
        private m_onUpdate: t.UpdateCallback,
        private m_signingId: Name,
        private m_id: t.NodeID
    ) {
        this.m_vv.set(m_id, 0);

        // Bind async functions
        this.onSyncInterest = this.onSyncInterest.bind(this);
        this.sendSyncInterest = this.sendSyncInterest.bind(this);

        this.m_syncRegisteredPrefix = m_endpoint.produce(m_syncPrefix, this.onSyncInterest);

        // Start periodically send sync interest
        this.retxSyncInterest();
    }

    private async onSyncInterest(interest: Interest) {
        return undefined;
    }

    private retxSyncInterest() {
        this.sendSyncInterest();
        clearTimeout(this.m_retxEvent);
        this.m_retxEvent = setTimeout(this.retxSyncInterest.bind(this), 1000);
    }

    private async sendSyncInterest() {
        console.log('sending sync interest');

        const syncName = this.m_syncPrefix
            .append(new Component(VersionVector.TT, this.m_vv.encode()));

        const interest = new Interest(syncName);
        interest.canBePrefix = true;
        interest.mustBeFresh = true;

        let data: Data;
        try {
            data = await this.m_endpoint.consume(interest);
        } catch (err) {
            console.error(err);
            return;
        }

        console.log('GOT SYNC REPLY: ', data.content);
    }
}
