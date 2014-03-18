export interface IByteReader
{
    current(): number;
    moveNext(): void;
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
    AAA,
    AAS,
    ADD,
    ADC,
    AND,
    CMP,
    DAA,
    DAS,
    OR,
    POP,
    PUSH,
    SBB,
    SUB,
    XOR
}

export enum Size
{
    Int8,
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

export enum Prefix
{
    None,
    REPE,
    REPNE,
    LOCK
}

export enum Register
{
    AL,
    AX,
    EAX,
    CL,
    CX,
    ECX,
    DL,
    DX,
    EDX,
    BL,
    BX,
    EBX,
    AH,
    SP,
    ESP,
    CH,
    BP,
    EBP,
    DH,
    SI,
    ESI,
    BH,
    DI,
    EDI,
    Max = EDI
}

export enum OperandType
{
    Register,
    Immediate,
    Segment
}

export class Operand
{
    private _type: OperandType;

    constructor(type: OperandType)
    {
        this._type = type;
    }

    public get type(): OperandType
    {
        return this._type;
    }
}

export class RegisterOperand extends Operand
{
    private static _registerOperands: RegisterOperand[];
    private _reg: Register;

    public static getRegister(reg: Register): RegisterOperand
    {
        if (!this._registerOperands)
        {
            this._registerOperands = [];
        }

        if (!this._registerOperands[reg])
        {
            this._registerOperands[reg] = new RegisterOperand(reg);
        }

        return this._registerOperands[reg];
    }

    constructor(reg: Register)
    {
        super(OperandType.Register);
        this._reg = reg;
    }

    public get register(): Register
    {
        return this._reg;
    }
}

export class SegmentOperand extends Operand
{
    private static _segmentOperands: SegmentOperand[];
    private _seg: Segment;

    public static getSegment(seg: Segment): SegmentOperand
    {
        if (!this._segmentOperands)
        {
            this._segmentOperands = [];
        }

        if (!this._segmentOperands[seg])
        {
            this._segmentOperands[seg] = new SegmentOperand(seg);
        }

        return this._segmentOperands[seg];
    }

    constructor(seg: Segment)
    {
        super(OperandType.Segment);
        this._seg = seg;
    }

    public get segment(): Segment
    {
        return this._seg;
    }
}

export class ImmediateOperand extends Operand
{
    private _value: number;
    private _size: Size;

    constructor(value: number, size: Size)
    {
        super(OperandType.Immediate);
        this._size = size;
        this._value = value;
    }

    public get value(): number
    {
        return this._value;
    }

    public get size(): Size
    {
        return this._size;
    }
}

export class Instruction
{
    private _opCode: OpCode;
    private _source: Operand;
    private _destination: Operand;

    constructor(opCode: OpCode, source: Operand = null, destination: Operand = null)
    {
        this._opCode = opCode;
        this._source = source;
        this._destination = destination;
    }

    public get opCode(): OpCode
    {
        return this._opCode;
    }

    public get source(): Operand
    {
        return this._source;
    }

    public get destination(): Operand
    {
        return this._destination;
    }
}

class InstructionState
{
    private _addressMode: Size;
    private _addressModeSet: boolean;
    private _operandSize: Size;
    private _operandSizeSet: boolean;
    private _segmentOverride: Segment;
    private _prefix: Prefix;

    constructor(sizeDefault: Size)
    {
        this._addressMode = sizeDefault;
        this._addressModeSet = false;
        this._operandSize = sizeDefault;
        this._operandSizeSet = false;
        this._segmentOverride = Segment.None;
        this._prefix = Prefix.None;
    }

    public get addressMode(): Size
    {
        return this._addressMode;
    }

    public get operandSize(): Size
    {
        return this._operandSize;
    }

    public get segmentOverride(): Segment
    {
        return this._segmentOverride;
    }

    public get prefix(): Prefix
    {
        return this._prefix;
    }

    public toggleAddressMode(): void
    {
        if (this._addressModeSet)
        {
            throw new LayoutError("multiple address mode prefixes");
        }
        else
        {
            this._addressModeSet = true;
        }

        this._addressMode = this._addressMode == Size.Int16 ?
        Size.Int32 : Size.Int16;
    }

    public toggleOperandSize(): void
    {
        if (this._operandSizeSet)
        {
            throw new LayoutError("multiple operand size prefixes");
        }
        else
        {
            this._operandSizeSet = true;
        }

        this._operandSize = this._operandSize == Size.Int16 ?
        Size.Int32 : Size.Int16;
    }

    public setSegmentOverride(segment: Segment): void
    {
        if (this._segmentOverride != Segment.None)
        {
            throw new LayoutError("multiple segment override prefixes");
        }

        this._segmentOverride = segment;
    }

    public setPrefix(prefix: Prefix): void
    {
        if (this._prefix != Prefix.None)
        {
            throw new LayoutError("multiple opcode prefixes");
        }

        this._prefix = prefix;
    }
}

export class Dissassembler
{
    private _sizeDefault: Size;

    constructor(sizeDefault: Size)
    {
        this._sizeDefault = sizeDefault;
    }

    private segmentOverride(segment: Segment, reader: IByteReader, state: InstructionState): Instruction
    {
        reader.moveNext();
        state.setSegmentOverride(segment);
        return this.firstByte(reader, state);
    }

    private readImmediate(reader: IByteReader, size: Size): ImmediateOperand
    {
        var value: number = 0;
        for (var index: number = 0; index < <number>size; index++)
        {
            value += reader.current() << (8 * index);
            reader.moveNext();
        }

        return new ImmediateOperand(value, size);
    }

    private readReg(reader: IByteReader, size: Size): RegisterOperand
    {
        return RegisterOperand.getRegister((((reader.current() >> 3) & 0x7) * 3) + size);
    }

    private readModrm(reader: IByteReader, size: Size): RegisterOperand
    {
        var mod: number = reader.current() >> 6;
        var rm: number = reader.current() & 0x7;

        switch (mod)
        {
            case 0x0:
                break;
            case 0x1:
                break;
            case 0x2:
                break;
            case 0x3:
                return RegisterOperand.getRegister((rm * 3) + size);
        }
    }

    private arithmeticOperation(opCode: OpCode, index: number, reader: IByteReader, state: InstructionState): Instruction
    {
        reader.moveNext();

        var source: Operand;
        var destination: Operand;

        switch (index)
        {
            case 0x0: // Eb, Gb
                source = this.readReg(reader, Size.Int8);
                destination = this.readModrm(reader, Size.Int8);
                reader.moveNext();
                break;

            case 0x1: // Ev, Gv
                source = this.readReg(reader, state.operandSize);
                destination = this.readModrm(reader, state.operandSize);
                reader.moveNext();
                break;

            case 0x2: // Gb, Eb
                source = this.readModrm(reader, Size.Int8);
                destination = this.readReg(reader, Size.Int8);
                reader.moveNext();
                break;

            case 0x3: // Gv, Ev
                source = this.readModrm(reader, state.operandSize);
                destination = this.readReg(reader, state.operandSize);
                reader.moveNext();
                break;

            case 0x4: // AL, Ib
                source = this.readImmediate(reader, Size.Int8);
                destination = RegisterOperand.getRegister(Register.AL);
                break;

            case 0x5: // eAX, Iv
                source = this.readImmediate(reader, state.operandSize);
                destination = RegisterOperand.getRegister(state.operandSize == Size.Int16 ? Register.AX : Register.EAX);
                break;

            default:
                throw new LayoutError("invalid opcode");
        }

        return new Instruction(opCode, source, destination);
    }

    private firstByte(reader: IByteReader, state: InstructionState): Instruction
    {
        var instr: Instruction;

        switch (reader.current())
        {
            case 0x00: // ADD Eb, Gb
            case 0x01: // ADD Ev, Gv
            case 0x02: // ADD Gb, Eb
            case 0x03: // ADD Gv, Ev
            case 0x04: // ADD AL, Ib
            case 0x05: // ADD rAX, Iz
                return this.arithmeticOperation(OpCode.ADD, reader.current() - 0x0, reader, state);

            case 0x06: // PUSH ES
                return new Instruction(OpCode.PUSH, SegmentOperand.getSegment(Segment.ES));

            case 0x07: // POP ES
                return new Instruction(OpCode.POP, SegmentOperand.getSegment(Segment.ES));

            case 0x08: // OR Eb, Gb
            case 0x09: // OR Ev, Gv
            case 0x0A: // OR Gb, Eb
            case 0x0B: // OR Gv, Ev
            case 0x0C: // OR AL, Ib
            case 0x0D: // OR rAX, Iz
                return this.arithmeticOperation(OpCode.OR, reader.current() - 0x8, reader, state);

            case 0x0E: // PUSH CS
                return new Instruction(OpCode.PUSH, SegmentOperand.getSegment(Segment.CS));

            case 0x0F:
                return this.twoByteEscape(reader, state);

            case 0x10: // ADC Eb, Gb
            case 0x11: // ADC Ev, Gv
            case 0x12: // ADC Gb, Eb
            case 0x13: // ADC Gv, Ev
            case 0x14: // ADC AL, Ib
            case 0x15: // ADC rAX, Iz
                return this.arithmeticOperation(OpCode.ADC, reader.current() - 0x10, reader, state);

            case 0x16: // PUSH SS
                return new Instruction(OpCode.PUSH, SegmentOperand.getSegment(Segment.SS));

            case 0x17: // POP SS
                return new Instruction(OpCode.POP, SegmentOperand.getSegment(Segment.SS));

            case 0x18: // SBB Eb, Gb
            case 0x19: // SBB Ev, Gv
            case 0x1A: // SBB Gb, Eb
            case 0x1B: // SBB Gv, Ev
            case 0x1C: // SBB AL, Ib
            case 0x1D: // SBB rAX, Iz
                return this.arithmeticOperation(OpCode.SBB, reader.current() - 0x18, reader, state);

            case 0x1E: // PUSH DS
                return new Instruction(OpCode.PUSH, SegmentOperand.getSegment(Segment.DS));

            case 0x1F: // POP DS
                return new Instruction(OpCode.POP, SegmentOperand.getSegment(Segment.DS));

            case 0x20: // AND Eb, Gb
            case 0x21: // AND Ev, Gv
            case 0x22: // AND Gb, Eb
            case 0x23: // AND Gv, Ev
            case 0x24: // AND AL, Ib
            case 0x25: // AND rAX, Iz
                return this.arithmeticOperation(OpCode.AND, reader.current() - 0x20, reader, state);

            case 0x26: // ES segment override
                return this.segmentOverride(Segment.ES, reader, state);

            case 0x27: // DAA
                return new Instruction(OpCode.DAA);

            case 0x28: // SUB Eb, Gb
            case 0x29: // SUB Ev, Gv
            case 0x2A: // SUB Gb, Eb
            case 0x2B: // SUB Gv, Ev
            case 0x2C: // SUB AL, Ib
            case 0x2D: // SUB rAX, Iz
                return this.arithmeticOperation(OpCode.SUB, reader.current() - 0x28, reader, state);

            case 0x2E: // CS segment override
                return this.segmentOverride(Segment.CS, reader, state);

            case 0x2F: // DAS
                return new Instruction(OpCode.DAS);

            case 0x30: // XOR Eb, Gb
            case 0x31: // XOR Ev, Gv
            case 0x32: // XOR Gb, Eb
            case 0x33: // XOR Gv, Ev
            case 0x34: // XOR AL, Ib
            case 0x35: // XOR rAX, Iz
                return this.arithmeticOperation(OpCode.XOR, reader.current() - 0x30, reader, state);

            case 0x36: // SS segment override
                return this.segmentOverride(Segment.SS, reader, state);

            case 0x37: // AAA
                return new Instruction(OpCode.AAA);

            case 0x38: // CMP Eb, Gb
            case 0x39: // CMP Ev, Gv
            case 0x3A: // CMP Gb, Eb
            case 0x3B: // CMP Gv, Ev
            case 0x3C: // CMP AL, Ib
            case 0x3D: // CMP rAX, Iz
                return this.arithmeticOperation(OpCode.CMP, reader.current() - 0x38, reader, state);

            case 0x3E: // DS segment override
                return this.segmentOverride(Segment.DS, reader, state);

            case 0x3F: // AAS
                return new Instruction(OpCode.AAS);

            case 0x64: // FS segment override
                return this.segmentOverride(Segment.FS, reader, state);

            case 0x65: // GS segment override
                return this.segmentOverride(Segment.GS, reader, state);

            case 0x66: // Operand size prefix
                reader.moveNext();
                state.toggleOperandSize();
                return this.firstByte(reader, state);

            case 0x67: // Address size prefix
                reader.moveNext();
                state.toggleAddressMode();
                return this.firstByte(reader, state);

            case 0xF0: // LOCK prefix
                reader.moveNext();
                state.setPrefix(Prefix.LOCK);
                instr = this.firstByte(reader, state);
                // TODO: Check legal LOCK prefix
                return instr;

            case 0xF2: // REPNE prefix
                reader.moveNext();
                state.setPrefix(Prefix.REPNE);
                instr = this.firstByte(reader, state);
                // TODO: Check legal REPNE prefix
                return instr;

            case 0xF3: // REP/REPE prefix
                reader.moveNext();
                state.setPrefix(Prefix.REPE);
                instr = this.firstByte(reader, state);
                // TOD: Check legal REP/REPE prefix
                return instr;
        }
    }

    public disassemble(reader: IByteReader): Instruction
    {
        return this.firstByte(reader, new InstructionState(this._sizeDefault));
    }
}