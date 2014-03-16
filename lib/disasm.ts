export interface IByteReader
{
    current(): number;
    moveNext(): boolean;
}

export class LayoutError implements Error
{
    public name: string;

    constructor(public message: string)
    {
        this.name = "LayoutError";
    }
}

export enum OpCode
{
    add
}

export class Instruction
{
    constructor(public opCode: OpCode)
    {
    }
}

function expectMore(more: boolean): void
{
    if (!more)
    {
        throw new LayoutError("ran out of bytes");
    }
}

function arithmeticOperation(reader: IByteReader, opCode: OpCode, index: number): Instruction
{
    expectMore(reader.moveNext());

    switch (index)
    {
        case 0x0: // Eb, Gb
            break;

        case 0x1: // Ev, Gv
            break;

        case 0x2: // Gb, Eb
            break;

        case 0x3: // Gv, Ev
            break;

        case 0x4: // AL, Ib
            break;

        case 0x5: // rAX, Iz
            break;

        default:
            throw new LayoutError("invalid opcode");
    }
}

export function disassemble(reader: IByteReader): Instruction
{
    switch (reader.current())
    {
        case 0x00:
        case 0x01:
        case 0x02:
        case 0x03:
        case 0x04:
        case 0x05:
            return arithmeticOperation(reader, OpCode.add, reader.current() - 0x0);
    }
}