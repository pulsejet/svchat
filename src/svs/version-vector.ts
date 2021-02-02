import * as t from "./types";
import { Encoder, Decoder, EvDecoder, NNI } from "@ndn/tlv";

const TTVersionVector = 201;
const TTVersionVectorKey = 202;
const TTVersionVectorValue = 203;

export class VersionVector {
    private m_map: { [key: string]: t.SeqNo; } = {};
    public static TT = TTVersionVector;

    set(nid: t.NodeID, seqNo: t.SeqNo) {
        this.m_map[nid] = seqNo;
        return seqNo
    }

    get(nid: t.NodeID) {
        return this.m_map[nid] || 0;
    }

    encode(): Uint8Array {
        let encoder = new Encoder();
        for (const key of Object.keys(this.m_map).sort().reverse()) {
            encoder.prependTlv(TTVersionVectorValue, NNI(this.m_map[key]));
            encoder.prependTlv(TTVersionVectorKey, new TextEncoder().encode(key));
        }

        return encoder.output;
    }
}