import * as t from "./types";
import { Encoder, Decoder, EvDecoder, NNI } from "@ndn/tlv";
import { Component } from "@ndn/packet";

const TTVersionVector = 201;
const TTVersionVectorKey = 202;
const TTVersionVectorValue = 203;

export class VersionVector {
    private m_map: { [key: string]: t.SeqNo; } = {};

    public set(nid: t.NodeID, seqNo: t.SeqNo) {
        this.m_map[nid] = seqNo;
        return seqNo
    }

    public get(nid: t.NodeID) {
        return this.m_map[nid] || 0;
    }

    private encoder(): Encoder {
        let enc = new Encoder();

        for (const key of Object.keys(this.m_map).sort().reverse()) {
            enc.prependTlv(TTVersionVectorValue, NNI(this.m_map[key]));
            enc.prependTlv(TTVersionVectorKey, new TextEncoder().encode(key));
        }

        return enc;
    }

    public encodeToComponent(): Component {
        return new Component(TTVersionVector, this.encoder().output);
    }
}