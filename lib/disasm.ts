export interface IByteReader
{
    read(): number;
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
    Invalid,
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
    Segment,
    Indirect,
    Addition,
    Displacement,
    Scale
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

export class AdditionOperand extends Operand
{
    private _left: Operand;
    private _right: Operand;

    constructor(left: Operand, right: Operand)
    {
        super(OperandType.Addition);
        this._left = left;
        this._right = right;
    }

    public get left(): Operand
    {
        return this._left;
    }

    public get right(): Operand
    {
        return this._right;
    }
}

export class IndirectOperand extends Operand
{
    private _operand: Operand;

    constructor(operand: Operand)
    {
        super(OperandType.Indirect);
        this._operand = operand;
    }

    public get operand(): Operand
    {
        return this._operand;
    }
}

export class DisplacementOperand extends Operand
{
    private _value: number;

    constructor(value: number)
    {
        super(OperandType.Displacement);
        this._value = value;
    }

    public get value(): number
    {
        return this._value;
    }
}

export class ScaleOperand extends Operand
{
    private _index: IndirectOperand;
    private _scale: number;

    constructor(index: IndirectOperand, scale: number)
    {
        super(OperandType.Scale);
        this._index = index;
        this._scale = scale;
    }

    public get index(): IndirectOperand
    {
        return this._index;
    }

    public get scale(): number
    {
        return this._scale;
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
        if (sizeDefault != Size.Int16 && sizeDefault != Size.Int32)
        {
            throw new Error("invalid default size");
        }

        this._sizeDefault = sizeDefault;
    }

    private segmentOverride(segment: Segment, reader: IByteReader, state: InstructionState): Instruction
    {
        state.setSegmentOverride(segment);
        return this.firstByte(reader, state);
    }

    private readUnsigned(reader: IByteReader, size: Size): number
    {
        var value: number = 0;
        for (var index: number = 0; index < <number>size; index++)
        {
            value += reader.read() << (8 * index);
        }

        return value;
    }

    private readSigned(reader: IByteReader, size: Size): number
    {
        var value: number = 0;
        for (var index: number = 0; index < <number>size - 1; index++)
        {
            value += reader.read() << (8 * index);
        }

        var lastByte: number = reader.read();
        value += (lastByte & ~0x80) << (8 * index);

        if (lastByte & 0x80)
        {
            value = -value;
        }

        return value;
    }

    private readDisplacement(reader: IByteReader, size: Size): DisplacementOperand
    {
        return new DisplacementOperand(this.readSigned(reader, size));
    }

    private readImmediate(reader: IByteReader, size: Size): ImmediateOperand
    {
        return new ImmediateOperand(this.readUnsigned(reader, size), size);
    }

    private decodeReg(modrm: number, size: Size): RegisterOperand
    {
        var reg: number = (modrm >> 3) & 0x7;
        return RegisterOperand.getRegister((reg * 3) + size);
    }

    private decodeSib(reader: IByteReader, sib: number, operandSize: Size, addressMode: Size): Operand
    {
        var scale: number = (sib >> 6) & 0x3;
        var index: number = (sib >> 3) & 0x7;
        var base: number = sib & 0x7;

        var baseRegister: Register = <Register>((base * 3) + 3);
        var indexRegister: Register = <Register>((index * 3) + 3);
        var scaleValue: number = 1 << scale;
        var scaleOperand: ScaleOperand = null;

        if (indexRegister != Register.ESP)
        {
            scaleOperand = new ScaleOperand(new IndirectOperand(RegisterOperand.getRegister(indexRegister)), scaleValue);
        }

        var baseOperand: RegisterOperand = RegisterOperand.getRegister(baseRegister);

        if (baseRegister != Register.EBP)
        {
            if (scaleOperand)
            {
                return new AdditionOperand(baseOperand, scaleOperand);
            }
            else
            {
                return baseOperand;
            }
        }

        var displacementOperand: DisplacementOperand;

        switch (scale)
        {
            case 0x1:
                displacementOperand = this.readDisplacement(reader, Size.Int32);
                baseOperand = null;
                break;

            case 0x2:
                displacementOperand = this.readDisplacement(reader, Size.Int8);
                break;

            case 0x4:
                displacementOperand = this.readDisplacement(reader, Size.Int32);
                break;

            default:
            case 0x8:
                throw new LayoutError("invalid sib byte");
        }

        if (scaleOperand && baseOperand)
        {
            return new AdditionOperand(scaleOperand, new AdditionOperand(baseOperand, displacementOperand));
        }
        else if (scaleOperand)
        {
            return new AdditionOperand(scaleOperand, displacementOperand);
        }
        else if (baseOperand)
        {
            return new AdditionOperand(baseOperand, displacementOperand);
        }

        return displacementOperand;
    }

    private decodeModrm(reader: IByteReader, modrm: number, operandSize: Size, addressMode: Size): Operand
    {
        var mod: number = modrm >> 6;
        var rm: number = modrm & 0x7;
        var result: Operand = null;

        if (mod == 0x3)
        {
            return RegisterOperand.getRegister((rm * 3) + operandSize);
        }

        if (addressMode == Size.Int16)
        {
            switch (rm)
            {
                case 0x0:
                    result = new IndirectOperand(
                        new AdditionOperand(
                            RegisterOperand.getRegister(Register.BX),
                            RegisterOperand.getRegister(Register.SI)));
                    break;

                case 0x1:
                    result = new IndirectOperand(
                        new AdditionOperand(
                            RegisterOperand.getRegister(Register.BX),
                            RegisterOperand.getRegister(Register.DI)));
                    break;

                case 0x2:
                    result = new IndirectOperand(
                        new AdditionOperand(
                            RegisterOperand.getRegister(Register.BP),
                            RegisterOperand.getRegister(Register.SI)));
                    break;

                case 0x3:
                    result = new IndirectOperand(
                        new AdditionOperand(
                            RegisterOperand.getRegister(Register.BP),
                            RegisterOperand.getRegister(Register.DI)));
                    break;

                case 0x4:
                    result = new IndirectOperand(
                        RegisterOperand.getRegister(Register.SI));
                    break;

                case 0x5:
                    result = new IndirectOperand(
                        RegisterOperand.getRegister(Register.DI));
                    break;

                case 0x6:
                    if (mod == 0x0)
                    {
                        result = this.readDisplacement(reader, Size.Int16);
                    }
                    else
                    {
                        result = new IndirectOperand(
                            RegisterOperand.getRegister(Register.BP));
                    }
                    break;

                case 0x7:
                    result = new IndirectOperand(
                        RegisterOperand.getRegister(Register.BX));
                    break;
            }
        }
        else
        {
            switch (rm)
            {
                case 0x0:
                    result = new IndirectOperand(
                        RegisterOperand.getRegister(Register.EAX));
                    break;

                case 0x1:
                    result = new IndirectOperand(
                        RegisterOperand.getRegister(Register.ECX));
                    break;

                case 0x2:
                    result = new IndirectOperand(
                        RegisterOperand.getRegister(Register.EDX));
                    break;

                case 0x3:
                    result = new IndirectOperand(
                        RegisterOperand.getRegister(Register.EBX));
                    break;

                case 0x4:
                    result = this.decodeSib(reader, reader.read(), operandSize, addressMode);
                    break;

                case 0x5:
                    if (mod == 0x0)
                    {
                        result = this.readDisplacement(reader, Size.Int32);
                    }
                    else
                    {
                        result = new IndirectOperand(
                            RegisterOperand.getRegister(Register.EBP));
                    }
                    break;

                case 0x6:
                    result = new IndirectOperand(
                        RegisterOperand.getRegister(Register.ESI));
                    break;

                case 0x7:
                    result = new IndirectOperand(
                        RegisterOperand.getRegister(Register.EDI));
                    break;
            }
        }

        switch (mod)
        {
            case 0x0:
                // Nothing
                break;

            case 0x1:
                result = new AdditionOperand(result, this.readDisplacement(reader, Size.Int8));
                break;

            case 0x2:
                result = new AdditionOperand(result, this.readDisplacement(reader, addressMode));
                break;
        }

        return result;
    }

    private arithmeticOperation(opCode: OpCode, index: number, reader: IByteReader, state: InstructionState): Instruction
    {
        var source: Operand;
        var destination: Operand;
        var modrm: number;

        switch (index)
        {
            case 0x0: // Eb, Gb
                modrm = reader.read();
                source = this.decodeReg(modrm, Size.Int8);
                destination = this.decodeModrm(reader, modrm, Size.Int8, state.addressMode);
                break;

            case 0x1: // Ev, Gv
                modrm = reader.read();
                source = this.decodeReg(modrm, state.operandSize);
                destination = this.decodeModrm(reader, modrm, state.operandSize, state.addressMode);
                break;

            case 0x2: // Gb, Eb
                modrm = reader.read();
                source = this.decodeModrm(reader, modrm, Size.Int8, state.addressMode);
                destination = this.decodeReg(modrm, Size.Int8);
                break;

            case 0x3: // Gv, Ev
                modrm = reader.read();
                source = this.decodeModrm(reader, modrm, state.operandSize, state.addressMode);
                destination = this.decodeReg(modrm, state.operandSize);
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
        var opcode: number = reader.read();

        switch (opcode)
        {
            case 0x00: // ADD Eb, Gb
            case 0x01: // ADD Ev, Gv
            case 0x02: // ADD Gb, Eb
            case 0x03: // ADD Gv, Ev
            case 0x04: // ADD AL, Ib
            case 0x05: // ADD rAX, Iz
                return this.arithmeticOperation(OpCode.ADD, opcode - 0x0, reader, state);

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
                return this.arithmeticOperation(OpCode.OR, opcode - 0x8, reader, state);

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
                return this.arithmeticOperation(OpCode.ADC, opcode - 0x10, reader, state);

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
                return this.arithmeticOperation(OpCode.SBB, opcode - 0x18, reader, state);

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
                return this.arithmeticOperation(OpCode.AND, opcode - 0x20, reader, state);

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
                return this.arithmeticOperation(OpCode.SUB, opcode - 0x28, reader, state);

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
                return this.arithmeticOperation(OpCode.XOR, opcode - 0x30, reader, state);

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
                return this.arithmeticOperation(OpCode.CMP, opcode - 0x38, reader, state);

            case 0x3E: // DS segment override
                return this.segmentOverride(Segment.DS, reader, state);

            case 0x3F: // AAS
                return new Instruction(OpCode.AAS);

            case 0x64: // FS segment override
                return this.segmentOverride(Segment.FS, reader, state);

            case 0x65: // GS segment override
                return this.segmentOverride(Segment.GS, reader, state);

            case 0x66: // Operand size prefix
                state.toggleOperandSize();
                return this.firstByte(reader, state);

            case 0x67: // Address size prefix
                state.toggleAddressMode();
                return this.firstByte(reader, state);

            case 0xF0: // LOCK prefix
                state.setPrefix(Prefix.LOCK);
                instr = this.firstByte(reader, state);
                // TODO: Check legal LOCK prefix
                return instr;

            case 0xF2: // REPNE prefix
                state.setPrefix(Prefix.REPNE);
                instr = this.firstByte(reader, state);
                // TODO: Check legal REPNE prefix
                return instr;

            case 0xF3: // REP/REPE prefix
                state.setPrefix(Prefix.REPE);
                instr = this.firstByte(reader, state);
                // TOD: Check legal REP/REPE prefix
                return instr;
        }

        return new Instruction(OpCode.Invalid);
    }

    public disassemble(reader: IByteReader): Instruction
    {
        return this.firstByte(reader, new InstructionState(this._sizeDefault));
    }
}