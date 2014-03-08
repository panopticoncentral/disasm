/// <reference path="../typings/node/node.d.ts"/>

class BufferReader
{
    constructor(public buffer: NodeBuffer, public current: number)
    {
    }

    public readUInt16(): number
    {
        var value: number = this.buffer.readUInt16LE(this.current);
        this.current += 2;
        return value;
    }
}
