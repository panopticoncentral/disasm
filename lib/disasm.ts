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

export enum Size
{
    Int16,
    Int32
}

export enum Segment
{
    None,
    CS,
    SS,
    DS,
    ES,
    FS,
    GS
}

class InstructionState
{
    public addressMode: Size;
    public operandSize: Size;
    public segmentOverride: Segment;

    constructor(sizeDefault: Size)
    {
        this.addressMode = sizeDefault;
        this.operandSize = sizeDefault;
        this.segmentOverride = Segment.None;
    }

    public toggleAddressMode(): void
    {
        this.addressMode = this.addressMode == Size.Int16 ?
            Size.Int32 : Size.Int16;
    }

    public toggleOperandSize(): void
    {
        this.operandSize = this.operandSize == Size.Int16 ?
            Size.Int32 : Size.Int16;
    }

    public setSegmentOverride(segment: Segment): void
    {
        this.segmentOverride = segment;
    }
}

export class Dissassembler
{
    constructor(private sizeDefault: Size)
    {
    }

    private expectMore(more: boolean): void
    {
        if (!more)
        {
            throw new LayoutError("ran out of bytes");
        }
    }

    private arithmeticOperation(reader: IByteReader, opCode: OpCode, index: number): Instruction
    {
        this.expectMore(reader.moveNext());

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

    private segmentOverride(segment: Segment, reader: IByteReader, state: InstructionState): Instruction
    {
        this.expectMore(reader.moveNext());
        state.setSegmentOverride(segment);
        return this.firstByte(reader, state);
    }

    private firstByte(reader: IByteReader, state: InstructionState): Instruction
    {
        switch (reader.current())
        {
            case 0x00:
            case 0x01:
            case 0x02:
            case 0x03:
            case 0x04:
            case 0x05:
                return this.arithmeticOperation(reader, OpCode.add, reader.current() - 0x0);

            case 0x26: // ES segment override
                return this.segmentOverride(Segment.ES, reader, state);

            case 0x2E: // CS segment override
                return this.segmentOverride(Segment.CS, reader, state);

            case 0x36: // SS segment override
                return this.segmentOverride(Segment.SS, reader, state);

            case 0x3E: // DS segment override
                return this.segmentOverride(Segment.DS, reader, state);

            case 0x64: // FS segment override
                return this.segmentOverride(Segment.FS, reader, state);

            case 0x65: // GS segment override
                return this.segmentOverride(Segment.GS, reader, state);

            case 0x66: // Operand size prefix
                this.expectMore(reader.moveNext());
                state.toggleOperandSize();
                return this.firstByte(reader, state);

            case 0x67: // Address size prefix
                this.expectMore(reader.moveNext());
                state.toggleAddressMode();
                return this.firstByte(reader, state);
        }
    }

    public disassemble(reader: IByteReader): Instruction
    {
        return this.firstByte(reader, new InstructionState(this.sizeDefault));
    }
}