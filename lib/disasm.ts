export interface IByteReader {
    read(): number;
}

export class LayoutError implements Error {
    public name: string;

    constructor(public message: string) {
        this.name = "LayoutError";
    }
}

export enum OpCode {
    Invalid,
    AAA,
    AAD,
    AAM,
    AAS,
    ADD,
    ADC,
    AND,
    ARPL,
    BOUND,
    BSF,
    BSR,
    BT,
    BTC,
    BTR,
    BTS,
    CALL,
    CBW,
    CLC,
    CLD,
    CLI,
    CLTS,
    CMC,
    CMP,
    CMPS,
    CWD,
    DAA,
    DAS,
    DEC,
    DIV,
    ENTER,
    HLT,
    IDIV,
    INC,
    IMUL,
    IN,
    INS,
    INT,
    INTO,
    IRET,
    JCXZ,
    JB,
    JBE,
    JL,
    JLE,
    JO,
    JMP,
    JNB,
    JNBE,
    JNL,
    JNLE,
    JNO,
    JNP,
    JNS,
    JNZ,
    JP,
    JS,
    JZ,
    LAHF,
    LAR,
    LDS,
    LEA,
    LEAVE,
    LES,
    LFS,
    LGDT,
    LGS,
    LIDT,
    LMSW,
    LODS,
    LOOP,
    LOOPE,
    LOOPNE,
    LSL,
    LSS,
    LTR,
    MOV,
    MOVS,
    MOVSX,
    MOVZX,
    MUL,
    NEG,
    NOP,
    NOT,
    OR,
    OUT,
    OUTS,
    POP,
    POPA,
    POPF,
    PUSH,
    PUSHA,
    PUSHF,
    RCL,
    RCR,
    RET,
    ROL,
    ROR,
    SAHF,
    SAR,
    SBB,
    SCAS,
    SETB,
    SETBE,
    SETL,
    SETLE,
    SETO,
    SETNB,
    SETNBE,
    SETNL,
    SETNLE,
    SETNO,
    SETNP,
    SETNS,
    SETNZ,
    SETP,
    SETS,
    SETZ,
    SGDT,
    SHL,
    SHLD,
    SHR,
    SHRD,
    SIDT,
    SLDT,
    SMSW,
    STC,
    STD,
    STI,
    STOS,
    SUB,
    TEST,
    VERR,
    VERW,
    WAIT,
    XCHG,
    XLAT,
    XOR
}

export enum Size {
    Int8,
    Int16,
    Int32
}

export enum Segment {
    ES,
    CS,
    SS,
    DS,
    FS,
    GS,
    None
}

export enum Register {
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
    CR0,
    CR1,
    CR2,
    CR3,
    DR0,
    DR1,
    DR2,
    DR3,
    DR4,
    DR5,
    DR6,
    DR7,
    Invalid
}

export enum OperandType {
    Register,
    Immediate,
    Segment,
    Indirect,
    Addition,
    Scale,
    Repeat,
    Call
}

export enum RepeatType {
    None,
    Equal,
    NotEqual
}

enum OperandFlags {
    None = 0x00,
    MustBeMemory = 0x01,
    DontDereference = 0x02,
    Segment = 0x04,
    MustBeRegister = 0x08,
    ControlRegister = 0x10,
    DebugRegister = 0x20
}

export class Operand {
    private _type: OperandType;

    constructor(type: OperandType) {
        this._type = type;
    }

    public get type(): OperandType {
        return this._type;
    }

    public add(other: Operand): AdditionOperand {
        return new AdditionOperand(this, other);
    }

    public scaleBy(scale: number): ScaleOperand {
        return new ScaleOperand(this, scale);
    }

    public indirect(size: Size, segment: Segment): IndirectOperand {
        return new IndirectOperand(this, size, segment);
    }
}

export class RegisterOperand extends Operand {
    private static _registerOperands: RegisterOperand[];
    private _reg: Register;

    public static getRegister(reg: Register): RegisterOperand {
        if (reg < 0 || reg > Register.Invalid) {
            throw new LayoutError("invalid register");
        }

        if (!this._registerOperands) {
            this._registerOperands = [];
        }

        if (!this._registerOperands[reg]) {
            this._registerOperands[reg] = new RegisterOperand(reg);
        }

        return this._registerOperands[reg];
    }

    constructor(reg: Register) {
        super(OperandType.Register);
        this._reg = reg;
    }

    public get register(): Register {
        return this._reg;
    }

    public get size(): Size {
        return (this._reg % 3);
    }
}

export class SegmentOperand extends Operand {
    private static _segmentOperands: SegmentOperand[];
    private _seg: Segment;

    public static getSegment(seg: Segment): SegmentOperand {
        if (seg < 0 || seg >= Segment.None) {
            throw new LayoutError("invalid segment register");
        }

        if (!this._segmentOperands) {
            this._segmentOperands = [];
        }

        if (!this._segmentOperands[seg]) {
            this._segmentOperands[seg] = new SegmentOperand(seg);
        }

        return this._segmentOperands[seg];
    }

    constructor(seg: Segment) {
        super(OperandType.Segment);
        this._seg = seg;
    }

    public get segment(): Segment {
        return this._seg;
    }
}

export class ImmediateOperand extends Operand {
    private _value: number;
    private _size: Size;

    constructor(value: number, size: Size) {
        super(OperandType.Immediate);
        this._size = size;
        this._value = value;
    }

    public get value(): number {
        return this._value;
    }

    public get size(): Size {
        return this._size;
    }
}

export class CallOperand extends Operand {
    private _segmentValue: number;
    private _offsetValue: number;
    private _size: Size;

    constructor(segmentValue: number, offsetValue: number, size: Size) {
        super(OperandType.Call);
        this._segmentValue = segmentValue;
        this._offsetValue = offsetValue;
        this._size = size;
    }

    public get segmentValue(): number {
        return this._segmentValue;
    }

    public get offsetValue(): number {
        return this._offsetValue;
    }

    public get size(): Size {
        return this._size;
    }
}

export class AdditionOperand extends Operand {
    private _left: Operand;
    private _right: Operand;

    constructor(left: Operand, right: Operand) {
        super(OperandType.Addition);
        this._left = left;
        this._right = right;
    }

    public get left(): Operand {
        return this._left;
    }

    public get right(): Operand {
        return this._right;
    }
}

export class IndirectOperand extends Operand {
    private _operand: Operand;
    private _size: Size;
    private _segment: Segment;

    constructor(operand: Operand, size: Size, segment: Segment) {
        super(OperandType.Indirect);
        this._operand = operand;
        this._size = size;
        this._segment = segment;
    }

    public get operand(): Operand {
        return this._operand;
    }

    public get size(): Size {
        return this._size;
    }

    public get segment(): Segment {
        return this._segment;
    }
}

export class RepeatOperand extends Operand {
    private _operand: Operand;
    private _negate: boolean;

    constructor(operand: Operand, negate: boolean) {
        super(OperandType.Repeat);
        this._operand = operand;
        this._negate = negate;
    }

    public get operand(): Operand {
        return this._operand;
    }

    public get negate(): boolean {
        return this._negate;
    }
}

export class ScaleOperand extends Operand {
    private _index: Operand;
    private _scale: number;

    constructor(index: Operand, scale: number) {
        super(OperandType.Scale);
        this._index = index;
        this._scale = scale;
    }

    public get index(): Operand {
        return this._index;
    }

    public get scale(): number {
        return this._scale;
    }
}

export class Instruction {
    private _opCode: OpCode;
    private _isLocked: boolean;
    private _isNear: boolean;
    private _repeatType: RepeatType;
    private _isNegatedRepeat: boolean;
    private _operand1: Operand;
    private _operand2: Operand;
    private _operand3: Operand;

    constructor(opCode: OpCode, isLocked: boolean, isNear: boolean, repeatType: RepeatType, operand1: Operand = null, operand2: Operand = null, operand3: Operand = null) {
        this._opCode = opCode;
        this._isLocked = isLocked;
        this._isNear = isNear;
        this._repeatType = repeatType;
        this._operand1 = operand1;
        this._operand2 = operand2;
        this._operand3 = operand3;
    }

    public get opCode(): OpCode {
        return this._opCode;
    }

    public get isLocked(): boolean {
        return this._isLocked;
    }

    public get isNear(): boolean {
        return this._isNear;
    }

    public get repeatType(): RepeatType {
        return this._repeatType;
    }

    public get operand1(): Operand {
        return this._operand1;
    }

    public get operand2(): Operand {
        return this._operand2;
    }

    public get operand3(): Operand {
        return this._operand3;
    }
}

export class Disassembler {
    private _segmentAddressMode: Size;
    private _reader: IByteReader;
    private _operandSize: Size;
    private _addressMode: Size
    private _addressModeOverridden: boolean;
    private _operandSizeOverridden: boolean;
    private _segmentOverride: Segment;
    private _modrm: number;
    private _readModrm: boolean;
    private _opCode: OpCode;
    private _isLocked: boolean;
    private _repeatType: RepeatType;
    private _isNear: boolean;
    private _operandCount: number;
    private _operand1: Operand;
    private _operand2: Operand;
    private _operand3: Operand;

    constructor(segmentAddressMode: Size) {
        if (segmentAddressMode != Size.Int16 && segmentAddressMode != Size.Int32) {
            throw new Error("invalid default size");
        }

        this._segmentAddressMode = segmentAddressMode;
    }

    private reset(reader: IByteReader): Disassembler {
        if (this._reader != null) {
            throw new LayoutError("internal error");
        }
        this._opCode = OpCode.Invalid;
        this._reader = reader;
        this._operandSize = this._segmentAddressMode;
        this._addressMode = this._segmentAddressMode;
        this._addressModeOverridden = false;
        this._operandSizeOverridden = false;
        this._segmentOverride = Segment.None;
        this._modrm = 0;
        this._readModrm = false;
        this._isLocked = false;
        this._repeatType = RepeatType.None;
        this._isNear = false;
        this._operandCount = 0;
        this._operand1 = null;
        this._operand2 = null;
        this._operand3 = null;
        return this;
    }

    private flagSet(value: number, flag: number): boolean {
        return ((value & flag) == flag);
    }

    private readImmediate(size: Size, isSigned: boolean): number {
        var value: number = 0;
        for (var index: number = 0; index < <number>size - 1; index++) {
            value += this._reader.read() << (8 * index);
        }

        var lastByte: number = this._reader.read();

        if (isSigned) {
            value += (lastByte & ~0x80) << (8 * index);

            if (lastByte & 0x80) {
                value = -value;
            }
        }
        else {
            value += lastByte << (8 * index);
        }

        return value;
    }

    private ensureModrm(): number {
        if (!this._readModrm) {
            this._modrm = this._reader.read();
            this._readModrm = true;
        }

        return this._modrm;
    }

    private decodeOperandSize(index: number): Size {
        return this.flagSet(index, 0x1) ? this._operandSize : Size.Int8;
    }

    private decodeRegister(index: number, operandSize: Size): RegisterOperand {
        return RegisterOperand.getRegister((index * 3) + operandSize);
    }

    private register(reg: Register): RegisterOperand {
        return RegisterOperand.getRegister(reg);
    }

    private displacement(displacementSize: Size): ImmediateOperand {
        return new ImmediateOperand(this.readImmediate(displacementSize, true), displacementSize);
    }

    private immediate(immediateSize: Size): ImmediateOperand {
        return new ImmediateOperand(this.readImmediate(immediateSize, false), immediateSize);
    }

    private literal(value: number): ImmediateOperand {
        return new ImmediateOperand(value, Size.Int8);
    }

    private sib(operandSize: Size): Operand {
        var sib: number = this._reader.read();
        var scale: number = (sib >> 6) & 0x3;
        var index: number = (sib >> 3) & 0x7;
        var base: number = sib & 0x7;

        var scaleValue: number = 1 << scale;
        var scaleOperand: ScaleOperand = null;

        if (index != 0x4 && scale > 0) {
            scaleOperand = this.decodeRegister(index, operandSize).scaleBy(scaleValue);
        }

        var baseOperand: RegisterOperand = this.decodeRegister(base, operandSize);

        if (base != 0x5) {
            if (scaleOperand) {
                return baseOperand.add(scaleOperand);
            }
            else {
                return baseOperand;
            }
        }

        var displacementOperand: ImmediateOperand;

        switch (scale) {
            case 0x1:
                displacementOperand = this.displacement(Size.Int32);
                baseOperand = null;
                break;

            case 0x2:
                displacementOperand = this.displacement(Size.Int8);
                break;

            case 0x4:
                displacementOperand = this.displacement(Size.Int32);
                break;

            default:
            case 0x8:
                throw new LayoutError("invalid sib byte");
        }

        if (scaleOperand && baseOperand) {
            return scaleOperand.add(baseOperand.add(displacementOperand));
        }
        else if (scaleOperand) {
            return scaleOperand.add(displacementOperand);
        }
        else if (baseOperand) {
            return baseOperand.add(displacementOperand);
        }

        return displacementOperand;
    }

    private nextOperand(operand: Operand): Disassembler {
        this._operandCount++;

        switch (this._operandCount) {
            case 1:
                if (this._isLocked && operand.type == OperandType.Register) {
                    throw new LayoutError("invalid destination");
                }
                this._operand1 = operand;
                break;
            case 2:
                this._operand2 = operand;
                break;
            case 3:
                this._operand3 = operand;
                break;
            default:
                throw new LayoutError("invalid number of arguments");
        }

        return this;
    }

    private segmentOperand(seg: Segment): Disassembler {
        return this.nextOperand(SegmentOperand.getSegment(seg));
    }

    private regOperand(operandSize: Size, flags: OperandFlags = OperandFlags.None): Disassembler {
        var modrm: number = this.ensureModrm();
        var reg: number = (modrm >> 3) & 0x7;

        if (this.flagSet(flags, OperandFlags.Segment)) {
            return this.segmentOperand(reg);
        }
        else if (this.flagSet(flags, OperandFlags.ControlRegister)) {
            if (reg > 3) {
                throw new LayoutError("invalid control register");
            }
            return this.registerOperand(Register.CR0 + reg);
        }
        else if (this.flagSet(flags, OperandFlags.DebugRegister)) {
            return this.registerOperand(Register.DR0 + reg);
        }
        else {
            return this.encodedRegisterOperand(reg, operandSize);
        }
    }

    private modrmOperand(operandSize: Size, flags: OperandFlags = OperandFlags.None): Disassembler {
        var modrm: number = this.ensureModrm();
        var mod: number = modrm >> 6;
        var rm: number = modrm & 0x7;
        var result: Operand = null;

        if (mod == 0x3 || this.flagSet(flags, OperandFlags.MustBeRegister)) {
            if (this.flagSet(flags, OperandFlags.MustBeMemory)) {
                throw new LayoutError("expected memory location");
            }
            return this.nextOperand(this.decodeRegister(rm, operandSize));
        }

        if (this._addressMode == Size.Int16) {
            switch (rm) {
                case 0x0:
                    result = this.register(Register.BX).add(this.register(Register.SI));
                    break;

                case 0x1:
                    result = this.register(Register.BX).add(this.register(Register.DI));
                    break;

                case 0x2:
                    result = this.register(Register.BP).add(this.register(Register.SI));
                    break;

                case 0x3:
                    result = this.register(Register.BP).add(this.register(Register.DI));
                    break;

                case 0x4:
                    result = this.register(Register.SI);
                    break;

                case 0x5:
                    result = this.register(Register.DI);
                    break;

                case 0x6:
                    if (mod == 0x0) {
                        result = this.displacement(this._addressMode);
                    }
                    else {
                        result = this.register(Register.BP);
                    }
                    break;

                case 0x7:
                    result = this.register(Register.BX);
                    break;
            }
        }
        else {
            if (rm == 0x4) {
                result = this.sib(operandSize);
            }
            else if (rm == 0x5 && mod == 0x00) {
                result = this.displacement(this._addressMode);
            }
            else {
                result = this.decodeRegister(rm, operandSize);
            }
        }

        switch (mod) {
            case 0x0:
                // Nothing
                break;

            case 0x1:
                result = result.add(this.displacement(Size.Int8));
                break;

            case 0x2:
                result = result.add(this.displacement(this._addressMode));
                break;
        }

        return this.nextOperand(
            this.flagSet(flags, OperandFlags.DontDereference) ?
            result :
            result.indirect(this._operandSize, this._segmentOverride));
    }

    private esdiOperand(operandSize: Size): Disassembler {
        return this.nextOperand(this.register(Register.DI).indirect(operandSize, Segment.ES));
    }

    private dssiOperand(operandSize: Size): Disassembler {
        return this.nextOperand(this.register(Register.SI).indirect(operandSize, Segment.DS));
    }

    private registerOperand(reg: Register): Disassembler {
        return this.nextOperand(RegisterOperand.getRegister(reg));
    }

    private encodedRegisterOperand(index: number, operandSize: Size): Disassembler {
        return this.nextOperand(this.decodeRegister(index, operandSize));
    }

    private literalOperand(value: number): Disassembler {
        return this.nextOperand(this.literal(value));
    }

    private immediateOperand(operandSize: Size): Disassembler {
        return this.nextOperand(this.immediate(operandSize));
    }

    private displacementOperand(operandSize: Size): Disassembler {
        return this.nextOperand(this.displacement(operandSize));
    }

    private offsetOperand(operandSize: Size): Disassembler {
        return this.nextOperand(this.immediate(this._addressMode).indirect(operandSize, this._segmentOverride));
    }

    private callOperand(flags: OperandFlags = OperandFlags.None): Disassembler {
        var segmentValue: number = this.flagSet(flags, OperandFlags.Segment) ?
            this.readImmediate(Size.Int16, false) :
            this._segmentOverride;
        var offsetValue: number = this.readImmediate(this._addressMode, false);
        return this.nextOperand(new CallOperand(segmentValue, offsetValue, this._addressMode));
    }

    private arithmeticOperands(index: number): Disassembler {
        var operandSize: Size = this.decodeOperandSize(index);

        switch (index - 0x1) {
            case 0x0:
                // Eb/Ev, Gb/Gv
                return this.modrmOperand(operandSize).regOperand(operandSize);

            case 0x2:
                // Gb/Gv, Eb/Ev
                return this.regOperand(operandSize).modrmOperand(operandSize);

            case 0x4:
                // AL/eAX, Ib/v
                return this.encodedRegisterOperand(0, operandSize).immediateOperand(operandSize);

            default:
                throw new LayoutError("unexpected opcode");
        }
    }

    private segmentOverride(segment: Segment): Disassembler {
        if (this._segmentOverride != Segment.None) {
            throw new LayoutError("invalid segment override");
        }
        this._segmentOverride = segment;
        return this;
    }

    private addressModeOverride(): Disassembler {
        if (this._addressModeOverridden) {
            throw new LayoutError("multiple address mode prefixes");
        }
        else {
            this._addressModeOverridden = true;
        }

        this._addressMode = this._addressMode == Size.Int16 ? Size.Int32 : Size.Int16;
        return this;
    }

    private operandSizeOverride(): Disassembler {
        if (this._operandSizeOverridden) {
            throw new LayoutError("multiple operand size prefixes");
        }
        else {
            this._operandSizeOverridden = true;
        }

        this._operandSize = this._operandSize == Size.Int16 ? Size.Int32 : Size.Int16;
        return this;
    }

    private repeatType(repeatType: RepeatType): Disassembler {
        if (this._repeatType != RepeatType.None || repeatType == RepeatType.None) {
            throw new LayoutError("multiple repeat prefixes");
        }

        this._repeatType = repeatType;
        return this;
    }

    private locked(): Disassembler {
        if (this._isLocked) {
            throw new LayoutError("multiple LOCK prefixes");
        }

        this._isLocked = true;
        return this;
    }

    private near(): Disassembler {
        if (this._isNear) {
            throw new LayoutError("internal error");
        }

        this._isNear = true;
        return this;
    }

    private group1OpCode(): Disassembler {
        var modrm: number = this.ensureModrm();
        switch ((modrm >> 3) & 0x7) {
            case 0x0:
                return this.opCode(OpCode.ADD);
            case 0x1:
                return this.opCode(OpCode.OR);
            case 0x2:
                return this.opCode(OpCode.ADC);
            case 0x3:
                return this.opCode(OpCode.SBB);
            case 0x4:
                return this.opCode(OpCode.AND);
            case 0x5:
                return this.opCode(OpCode.SUB);
            case 0x6:
                return this.opCode(OpCode.XOR);
            case 0x7:
                return this.opCode(OpCode.CMP);
            default:
                throw new LayoutError("internal error");
        }
    }

    private group2OpCode(): Disassembler {
        var modrm: number = this.ensureModrm();
        switch ((modrm >> 3) & 0x7) {
            case 0x0:
                return this.opCode(OpCode.ROL);
            case 0x1:
                return this.opCode(OpCode.ROR);
            case 0x2:
                return this.opCode(OpCode.RCL);
            case 0x3:
                return this.opCode(OpCode.RCR);
            case 0x4:
                return this.opCode(OpCode.SHL);
            case 0x5:
                return this.opCode(OpCode.SHR);
            // case 0x6: Unused
            case 0x7:
                return this.opCode(OpCode.SAR);
            default:
                throw new LayoutError("internal error");
        }
    }

    private group4OpCode(): Disassembler {
        var modrm: number = this.ensureModrm();
        switch ((modrm >> 3) & 0x7) {
            case 0x0:
                return this.opCode(OpCode.INC);
            case 0x1:
                return this.opCode(OpCode.DEC);
            // case 0x2 - 0x7: Unused
            default:
                throw new LayoutError("internal error");
        }
    }

    private group6OpCode(): Disassembler {
        var modrm: number = this.ensureModrm();
        switch ((modrm >> 3) & 0x7) {
            case 0x0: // SLDT Ew
                return this.opCode(OpCode.SLDT);
            case 0x1: // SIDT Ew
                return this.opCode(OpCode.SIDT);
            case 0x2: // LGDT Ew
                return this.opCode(OpCode.LGDT);
            case 0x3: // LTR Ew
                return this.opCode(OpCode.LTR);
            case 0x4: // VERR Ew
                return this.opCode(OpCode.VERR);
            case 0x5: // VERW Ew
                return this.opCode(OpCode.VERW);
            // 0x6 - 0x7: Unused
            default:
                throw new LayoutError("internal error");
        }
    }

    private group8OpCode(): Disassembler {
        var modrm: number = this.ensureModrm();
        switch ((modrm >> 3) & 0x7) {
            // 0x0 - 0x3 Unused
            case 0x4:
                return this.opCode(OpCode.BT);
            case 0x5:
                return this.opCode(OpCode.BTS);
            case 0x6:
                return this.opCode(OpCode.BTR);
            case 0x7:
                return this.opCode(OpCode.BTC);
            default:
                throw new LayoutError("internal error");
        }
    }

    private jumpOpCode(index: number): Disassembler {
        switch (index) {
            case 0x0:
                return this.opCode(OpCode.JO);
            case 0x1:
                return this.opCode(OpCode.JNO);
            case 0x2:
                return this.opCode(OpCode.JB);
            case 0x3:
                return this.opCode(OpCode.JNB);
            case 0x4:
                return this.opCode(OpCode.JZ);
            case 0x5:
                return this.opCode(OpCode.JNZ);
            case 0x6:
                return this.opCode(OpCode.JBE);
            case 0x7:
                return this.opCode(OpCode.JNBE);
            case 0x8:
                return this.opCode(OpCode.JS);
            case 0x9:
                return this.opCode(OpCode.JNS);
            case 0xA:
                return this.opCode(OpCode.JP);
            case 0xB:
                return this.opCode(OpCode.JNP);
            case 0xC:
                return this.opCode(OpCode.JL);
            case 0xD:
                return this.opCode(OpCode.JNL);
            case 0xE:
                return this.opCode(OpCode.JLE);
            case 0xF:
                return this.opCode(OpCode.JNLE);
        }

        throw new LayoutError("unexpected jump opcode");
    }

    private setOpCode(index: number): Disassembler {
        switch (index) {
            case 0x0:
                return this.opCode(OpCode.SETO);
            case 0x1:
                return this.opCode(OpCode.SETNO);
            case 0x2:
                return this.opCode(OpCode.SETB);
            case 0x3:
                return this.opCode(OpCode.SETNB);
            case 0x4:
                return this.opCode(OpCode.SETZ);
            case 0x5:
                return this.opCode(OpCode.SETNZ);
            case 0x6:
                return this.opCode(OpCode.SETBE);
            case 0x7:
                return this.opCode(OpCode.SETNBE);
            case 0x8:
                return this.opCode(OpCode.SETS);
            case 0x9:
                return this.opCode(OpCode.SETNS);
            case 0xA:
                return this.opCode(OpCode.SETP);
            case 0xB:
                return this.opCode(OpCode.SETNP);
            case 0xC:
                return this.opCode(OpCode.SETL);
            case 0xD:
                return this.opCode(OpCode.SETNL);
            case 0xE:
                return this.opCode(OpCode.SETLE);
            case 0xF:
                return this.opCode(OpCode.SETNLE);
        }

        throw new LayoutError("unexpected set opcode");
    }

    private opCode(opCode: OpCode): Disassembler {
        if (this._opCode != OpCode.Invalid) {
            throw new LayoutError("internal error");
        }

        if (this._isLocked) {
            switch (this._opCode) {
                case OpCode.ADD:
                case OpCode.ADC:
                case OpCode.AND:
                case OpCode.BTC:
                case OpCode.BTR:
                case OpCode.BTS:
                case OpCode.DEC:
                case OpCode.INC:
                case OpCode.NEG:
                case OpCode.NOT:
                case OpCode.OR:
                case OpCode.SBB:
                case OpCode.SUB:
                case OpCode.XOR:
                case OpCode.XCHG:
                    break;

                default:
                    throw new LayoutError("invalid use of LOCK prefix");
            }
        }

        if (this._repeatType == RepeatType.Equal) {
            switch (this._opCode) {
                case OpCode.INS:
                case OpCode.OUTS:
                case OpCode.MOVS:
                case OpCode.LODS:
                case OpCode.STOS:
                case OpCode.CMPS:
                case OpCode.SCAS:
                    break;

                default:
                    throw new LayoutError("invalid use of REP/REPE prefix");
            }
        }

        if (this._repeatType == RepeatType.NotEqual) {
            switch (this._opCode) {
                case OpCode.CMPS:
                case OpCode.SCAS:
                    break;

                default:
                    throw new LayoutError("invalid use of REPNE prefix");
            }
        }

        this._opCode = opCode;
        return this;
    }

    private done(): Instruction {
        if (this._opCode == OpCode.Invalid) {
            throw new LayoutError("internal error");
        }
        
        this._reader = null;

        return new Instruction(this._opCode, this._isLocked, this._isNear, this._repeatType, this._operand1, this._operand2, this._operand3);
    }

    private group3(first: number): Instruction {
        var modrm: number = this.ensureModrm();
        switch ((modrm >> 3) & 0x7) {
            case 0x0:
                return this.opCode(OpCode.TEST).modrmOperand(this.decodeOperandSize(first)).immediateOperand(this.decodeOperandSize(first)).done();
            case 0x1: // unused
                throw new LayoutError("internal error");
            case 0x2:
                return this.opCode(OpCode.NOT).modrmOperand(this.decodeOperandSize(first)).done();
            case 0x3:
                return this.opCode(OpCode.NEG).modrmOperand(this.decodeOperandSize(first)).done();
            case 0x4:
                return this.opCode(OpCode.MUL).modrmOperand(this.decodeOperandSize(first)).done();
            case 0x5:
                return this.opCode(OpCode.IMUL).modrmOperand(this.decodeOperandSize(first)).done();
            case 0x6:
                return this.opCode(OpCode.DIV).modrmOperand(this.decodeOperandSize(first)).done();
            case 0x7:
                return this.opCode(OpCode.IDIV).modrmOperand(this.decodeOperandSize(first)).done();
            default:
                throw new LayoutError("internal error");
        }
    }

    private group5(): Instruction {
        var modrm: number = this.ensureModrm();
        switch ((modrm >> 3) & 0x7) {
            case 0x0: // INC Ev
                return this.opCode(OpCode.INC).modrmOperand(this._operandSize).done();
            case 0x1: // DEC Ev
                return this.opCode(OpCode.DEC).modrmOperand(this._operandSize).done();
            case 0x2: // near CALL Ev
                return this.near().opCode(OpCode.CALL).modrmOperand(this._operandSize).done();
            case 0x3: // far CALL Ep
                return this.opCode(OpCode.CALL).modrmOperand(this._operandSize).done();
            case 0x4: // near JMP Ev
                return this.opCode(OpCode.JMP).modrmOperand(this._operandSize).done();
            case 0x5: // far JMP Mp
                return this.opCode(OpCode.JMP).modrmOperand(this._operandSize, OperandFlags.MustBeMemory).done();
            case 0x6: // PUSH Ev
                return this.opCode(OpCode.PUSH).modrmOperand(this._operandSize).done();
            // case 0x7: Unused
            default:
                throw new LayoutError("internal error");
        }
    }

    private group7(): Instruction {
        var modrm: number = this.ensureModrm();
        switch ((modrm >> 3) & 0x7) {
            case 0x0: // SGDT Ms
                return this.opCode(OpCode.SGDT).modrmOperand(this._operandSize, OperandFlags.MustBeMemory).done();
            case 0x1: // SIDT Ms
                return this.opCode(OpCode.SIDT).modrmOperand(this._operandSize, OperandFlags.MustBeMemory).done();
            case 0x2: // LGDT Ms
                return this.opCode(OpCode.LGDT).modrmOperand(this._operandSize, OperandFlags.MustBeMemory).done();
            case 0x3: // LIDT Ms
                return this.opCode(OpCode.LIDT).modrmOperand(this._operandSize, OperandFlags.MustBeMemory).done();
            case 0x4: // SMSW Ew
                return this.opCode(OpCode.SMSW).modrmOperand(Size.Int16).done();
            // case 0x5: unused
            case 0x6: // LMSW Ew
                return this.opCode(OpCode.LMSW).modrmOperand(Size.Int16).done();
            // case 0x7: Unused
            default:
                throw new LayoutError("internal error");
        }
    }

    private secondByte(): Instruction {
        var second: number = this._reader.read();

        switch (second) {
            case 0x00: // Group 6
                return this.group6OpCode().modrmOperand(Size.Int16).done();

            case 0x01: // Group 7
                return this.group7();

            case 0x02: // LAR Gv, Ew
                return this.opCode(OpCode.LAR).regOperand(this._operandSize).modrmOperand(Size.Int16).done();

            case 0x03: // LSL Gv, Ew
                return this.opCode(OpCode.LSL).regOperand(this._operandSize).modrmOperand(Size.Int16).done();

            // Unused 0x04 - 0x05

            case 0x06: // CLTS
                return this.opCode(OpCode.CLTS).done();

            // Unused 0x07 - 1F

            case 0x20: // MOV Rd, Cd
                return this.opCode(OpCode.MOV).modrmOperand(Size.Int32, OperandFlags.MustBeRegister).regOperand(Size.Int32, OperandFlags.ControlRegister).done();

            case 0x21: // MOV Rd, Dd
                return this.opCode(OpCode.MOV).modrmOperand(Size.Int32, OperandFlags.MustBeRegister).regOperand(Size.Int32, OperandFlags.DebugRegister).done();

            case 0x22: // MOV Cd, Rd
                return this.opCode(OpCode.MOV).regOperand(Size.Int32, OperandFlags.ControlRegister).modrmOperand(Size.Int32, OperandFlags.MustBeRegister).done();

            case 0x23: // MOV Dd, Rd
                return this.opCode(OpCode.MOV).regOperand(Size.Int32, OperandFlags.DebugRegister).modrmOperand(Size.Int32, OperandFlags.MustBeRegister).done();

            // Unused 0x24 - 0x7F

            case 0x80: // JO Jv
            case 0x81: // JNO Jv
            case 0x82: // JB Jv
            case 0x83: // JNB Jv
            case 0x84: // JZ Jv
            case 0x85: // JNZ Jv
            case 0x86: // JBE Jv
            case 0x87: // JNBE Jv
            case 0x88: // JS Jv
            case 0x89: // JNS Jv
            case 0x8A: // JP Jv
            case 0x8B: // JNP Jv
            case 0x8C: // JL Jv
            case 0x8D: // JNL Jv
            case 0x8E: // JLE Jv
            case 0x8F: // JNLE Jv
                return this.jumpOpCode(second - 0x80).displacementOperand(this._operandSize).done();

            case 0x90: // SETO Eb
            case 0x91: // SETNO Eb
            case 0x92: // SETB Eb
            case 0x93: // SETNB Eb
            case 0x94: // SETZ Eb
            case 0x95: // SETNZ Eb
            case 0x96: // SETBE Eb
            case 0x97: // SETNBE Eb
                return this.setOpCode(second - 0x90).modrmOperand(Size.Int8).done();

            case 0x98: // SETS
            case 0x99: // SETNS
            case 0x9A: // SETP
            case 0x9B: // SETNP
            case 0x9C: // SETL
            case 0x9D: // SETNL
            case 0x9E: // SETLE
            case 0x9F: // SETNLE
                return this.setOpCode(second - 0x90).done();

            case 0xA0: // PUSH FS
                return this.opCode(OpCode.PUSH).segmentOperand(Segment.FS).done();

            case 0xA1: // POP FS
                return this.opCode(OpCode.POP).segmentOperand(Segment.FS).done();

            // Unused 0xA2

            case 0xA3: // BT Ev, Gv
                return this.opCode(OpCode.BT).modrmOperand(this._operandSize).regOperand(this._operandSize).done();

            case 0xA4: // SHLD Ev, Gv, Ib
                return this.opCode(OpCode.SHLD).modrmOperand(this._operandSize).regOperand(this._operandSize).immediateOperand(Size.Int8).done();

            case 0xA5: // SHLD Ev, Gv, CL
                return this.opCode(OpCode.SHLD).modrmOperand(this._operandSize).regOperand(this._operandSize).registerOperand(Register.CL).done();

            // Unused 0xA6 - 0xA7

            case 0xA8: // PUSH GS
                return this.opCode(OpCode.PUSH).segmentOperand(Segment.GS).done();

            case 0xA9: // POP GS
                return this.opCode(OpCode.POP).segmentOperand(Segment.GS).done();

            // Unused 0xAA

            case 0xAB: // BTS Ev, Gv
                return this.opCode(OpCode.BTS).modrmOperand(this._operandSize).regOperand(this._operandSize).done();

            case 0xAC: // SHRD Ev, Gv, Ib
                return this.opCode(OpCode.SHRD).modrmOperand(this._operandSize).regOperand(this._operandSize).immediateOperand(Size.Int8).done();

            case 0xAD: // SHRD Ev, Gv, CL
                return this.opCode(OpCode.SHRD).modrmOperand(this._operandSize).regOperand(this._operandSize).registerOperand(Register.CL).done();

            // Unused 0xAE

            case 0xAF: // IMUL Gv, Ev
                return this.opCode(OpCode.IMUL).regOperand(this._operandSize).modrmOperand(this._operandSize).done();

            // Unused 0xB0 - 0xB1

            case 0xB2: // LSS Gv, Mp
                return this.opCode(OpCode.LSS).regOperand(this._operandSize).modrmOperand(this._operandSize, OperandFlags.MustBeMemory).done();

            case 0xB3: // BTR Ev, Gv
                return this.opCode(OpCode.BTR).modrmOperand(this._operandSize).regOperand(this._operandSize).done();

            case 0xB4: // LFS Gv, Mp
                return this.opCode(OpCode.LFS).regOperand(this._operandSize).modrmOperand(this._operandSize, OperandFlags.MustBeMemory).done();

            case 0xB5: // LGS Gv, Mp
                return this.opCode(OpCode.LGS).regOperand(this._operandSize).modrmOperand(this._operandSize, OperandFlags.MustBeMemory).done();

            case 0xB6: // MOVZX Gv, Eb
                return this.opCode(OpCode.MOVZX).regOperand(this._operandSize).modrmOperand(Size.Int8).done();

            case 0xB7: // MOVZX Gv, Ew
                return this.opCode(OpCode.MOVZX).regOperand(this._operandSize).modrmOperand(Size.Int16).done();

            // Unused 0xB8 - 0xB9

            case 0xBA: // Group 8 Ev, Ib
                return this.group8OpCode().modrmOperand(this._operandSize).immediateOperand(Size.Int8).done();

            case 0xBB: // BTC Ev, Gv
                return this.opCode(OpCode.BTC).modrmOperand(this._operandSize).regOperand(this._operandSize).done();

            case 0xBC: // BSF Gv, Ev
                return this.opCode(OpCode.BSF).regOperand(this._operandSize).modrmOperand(this._operandSize).done();

            case 0xBD: // BSR Gv, Ev
                return this.opCode(OpCode.BSR).regOperand(this._operandSize).modrmOperand(this._operandSize).done();

            case 0xBE: // MOVSX Gv, Eb
                return this.opCode(OpCode.MOVSX).regOperand(this._operandSize).modrmOperand(Size.Int8).done();

            case 0xBF: // MOVSX Gv, Ew
                return this.opCode(OpCode.BSF).regOperand(this._operandSize).modrmOperand(Size.Int16).done();

            // Unused 0xC0 - 0xFF
        }

        throw new LayoutError("invalid instruction");
    }

    private firstByte(): Instruction {
        var first: number = this._reader.read();

        switch (first) {
            case 0x00: // ADD Eb, Gb
            case 0x01: // ADD Ev, Gv
            case 0x02: // ADD Gb, Eb
            case 0x03: // ADD Gv, Ev
            case 0x04: // ADD AL, Ib
            case 0x05: // ADD rAX, Iz
                return this.opCode(OpCode.ADD).arithmeticOperands(first - 0x0).done();

            case 0x06: // PUSH ES
                return this.opCode(OpCode.PUSH).segmentOperand(Segment.ES).done();

            case 0x07: // POP ES
                return this.opCode(OpCode.POP).segmentOperand(Segment.ES).done();

            case 0x08: // OR Eb, Gb
            case 0x09: // OR Ev, Gv
            case 0x0A: // OR Gb, Eb
            case 0x0B: // OR Gv, Ev
            case 0x0C: // OR AL, Ib
            case 0x0D: // OR rAX, Iz
                return this.opCode(OpCode.OR).arithmeticOperands(first - 0x8).done();

            case 0x0E: // PUSH CS
                return this.opCode(OpCode.PUSH).segmentOperand(Segment.CS).done();

            case 0x0F: // Two byte escape
                return this.secondByte();

            case 0x10: // ADC Eb, Gb
            case 0x11: // ADC Ev, Gv
            case 0x12: // ADC Gb, Eb
            case 0x13: // ADC Gv, Ev
            case 0x14: // ADC AL, Ib
            case 0x15: // ADC rAX, Iz
                return this.opCode(OpCode.ADC).arithmeticOperands(first - 0x10).done();

            case 0x16: // PUSH SS
                return this.opCode(OpCode.PUSH).segmentOperand(Segment.SS).done();

            case 0x17: // POP SS
                return this.opCode(OpCode.POP).segmentOperand(Segment.SS).done();

            case 0x18: // SBB Eb, Gb
            case 0x19: // SBB Ev, Gv
            case 0x1A: // SBB Gb, Eb
            case 0x1B: // SBB Gv, Ev
            case 0x1C: // SBB AL, Ib
            case 0x1D: // SBB rAX, Iz
                return this.opCode(OpCode.SBB).arithmeticOperands(first - 0x18).done();

            case 0x1E: // PUSH DS
                return this.opCode(OpCode.PUSH).segmentOperand(Segment.DS).done();

            case 0x1F: // POP DS
                return this.opCode(OpCode.POP).segmentOperand(Segment.DS).done();

            case 0x20: // AND Eb, Gb
            case 0x21: // AND Ev, Gv
            case 0x22: // AND Gb, Eb
            case 0x23: // AND Gv, Ev
            case 0x24: // AND AL, Ib
            case 0x25: // AND rAX, Iz
                return this.opCode(OpCode.AND).arithmeticOperands(first - 0x20).done();

            case 0x26: // ES segment override
                return this.segmentOverride(Segment.ES).firstByte();

            case 0x27: // DAA
                return this.opCode(OpCode.DAA).done();

            case 0x28: // SUB Eb, Gb
            case 0x29: // SUB Ev, Gv
            case 0x2A: // SUB Gb, Eb
            case 0x2B: // SUB Gv, Ev
            case 0x2C: // SUB AL, Ib
            case 0x2D: // SUB rAX, Iz
                return this.opCode(OpCode.SUB).arithmeticOperands(first - 0x28).done();

            case 0x2E: // CS segment override
                return this.segmentOverride(Segment.CS).firstByte();

            case 0x2F: // DAS
                return this.opCode(OpCode.DAS).done();

            case 0x30: // XOR Eb, Gb
            case 0x31: // XOR Ev, Gv
            case 0x32: // XOR Gb, Eb
            case 0x33: // XOR Gv, Ev
            case 0x34: // XOR AL, Ib
            case 0x35: // XOR rAX, Iz
                return this.opCode(OpCode.XOR).arithmeticOperands(first - 0x30).done();

            case 0x36: // SS segment override
                return this.segmentOverride(Segment.SS).firstByte();

            case 0x37: // AAA
                return this.opCode(OpCode.AAA).done();

            case 0x38: // CMP Eb, Gb
            case 0x39: // CMP Ev, Gv
            case 0x3A: // CMP Gb, Eb
            case 0x3B: // CMP Gv, Ev
            case 0x3C: // CMP AL, Ib
            case 0x3D: // CMP rAX, Iz
                return this.opCode(OpCode.CMP).arithmeticOperands(first - 0x38).done();

            case 0x3E: // DS segment override
                return this.segmentOverride(Segment.DS).firstByte();

            case 0x3F: // AAS
                return this.opCode(OpCode.AAS).done();

            case 0x40: // INC eAX
            case 0x41: // INC eCX
            case 0x42: // INC eDX
            case 0x43: // INC eBX
            case 0x44: // INC eSP
            case 0x45: // INC eBP
            case 0x46: // INC eSI
            case 0x47: // INC eDI
                return this.opCode(OpCode.INC).encodedRegisterOperand(first - 0x40, this._operandSize).done();

            case 0x48: // DEC eAX
            case 0x49: // DEC eCX
            case 0x4A: // DEC eDX
            case 0x4B: // DEC eBX
            case 0x4C: // DEC eSP
            case 0x4D: // DEC eBP
            case 0x4E: // DEC eSI
            case 0x4F: // DEC eDI
                return this.opCode(OpCode.DEC).encodedRegisterOperand(first - 0x48, this._operandSize).done();

            case 0x50: // PUSH eAX
            case 0x51: // PUSH eCX
            case 0x52: // PUSH eDX
            case 0x53: // PUSH eBX
            case 0x54: // PUSH eSP
            case 0x55: // PUSH eBP
            case 0x56: // PUSH eSI
            case 0x57: // PUSH eDI
                return this.opCode(OpCode.PUSH).encodedRegisterOperand(first - 0x50, this._operandSize).done();

            case 0x58: // POP eAX
            case 0x59: // POP eCX
            case 0x5A: // POP eDX
            case 0x5B: // POP eBX
            case 0x5C: // POP eSP
            case 0x5D: // POP eBP
            case 0x5E: // POP eSI
            case 0x5F: // POP eDI
                return this.opCode(OpCode.POP).encodedRegisterOperand(first - 0x58, this._operandSize).done();

            case 0x60: // PUSHA
                return this.opCode(OpCode.PUSHA).done();

            case 0x61: // POPA
                return this.opCode(OpCode.POPA).done();

            case 0x62: // BOUND Gv, Ma
                return this.opCode(OpCode.BOUND).regOperand(this._operandSize).modrmOperand(this._operandSize, OperandFlags.MustBeMemory).done();

            case 0x63: // ARPL Ew, Gw
                return this.opCode(OpCode.ARPL).modrmOperand(Size.Int16).regOperand(Size.Int16).done();

            case 0x64: // FS segment override
                return this.segmentOverride(Segment.FS).firstByte();

            case 0x65: // GS segment override
                return this.segmentOverride(Segment.GS).firstByte();

            case 0x66: // Operand size prefix
                return this.operandSizeOverride().firstByte();

            case 0x67: // Address size prefix
                return this.addressModeOverride().firstByte();

            case 0x68: // PUSH Iz
                return this.opCode(OpCode.PUSH).immediateOperand(this._operandSize).done();

            case 0x69: // IMUL Gv, Ev, Iz
                return this.opCode(OpCode.IMUL).regOperand(this._operandSize).modrmOperand(this._operandSize).immediateOperand(this._operandSize).done();

            case 0x6A: // PUSH Ib
                return this.opCode(OpCode.PUSH).immediateOperand(Size.Int8).done();

            case 0x6B: // IMUL Gv, Ev, Ib
                return this.opCode(OpCode.IMUL).regOperand(this._operandSize).modrmOperand(this._operandSize).immediateOperand(Size.Int8).done();

            case 0x6C: // INSB Yb, DX
            case 0x6D: // INSW/INSD Yz, DX
                return this.opCode(OpCode.INS).esdiOperand(this.decodeOperandSize(first)).registerOperand(Register.DX).done();

            case 0x6E: // OUTSB DX, Xb
            case 0x6F: // OUTSW/OUTSD DX, Xz
                return this.opCode(OpCode.OUTS).registerOperand(Register.DX).dssiOperand(this.decodeOperandSize(first)).done();

            case 0x70: // JO Jb
            case 0x71: // JNO Jb
            case 0x72: // JB Jb
            case 0x73: // JNB Jb
            case 0x74: // JZ Jb
            case 0x75: // JNZ Jb
            case 0x76: // JBE Jb
            case 0x77: // JNBE Jb
            case 0x78: // JS Jb
            case 0x79: // JNS Jb
            case 0x7A: // JP Jb
            case 0x7B: // JNP Jb
            case 0x7C: // JL Jb
            case 0x7D: // JNL Jb
            case 0x7E: // JLE Jb
            case 0x7F: // JNLE Jb
                return this.jumpOpCode(first - 0x70).displacementOperand(Size.Int8).done();

            case 0x80: // Group 1 Eb, Ib
            case 0x81: // Group 1 Ev, Iz
                return this.group1OpCode().modrmOperand(this.decodeOperandSize(first)).immediateOperand(this.decodeOperandSize(first)).done();

            case 0x82: // Unused
                break;

            case 0x83: // Group 1 Ev, Ib
                return this.group1OpCode().modrmOperand(this._operandSize).immediateOperand(Size.Int8).done();

            case 0x84: // TEST Eb, Gb
            case 0x85: // TEST Ev, Gv
                return this.opCode(OpCode.TEST).arithmeticOperands(first - 0x84).done();

            case 0x86: // XCHG Eb, Gb
            case 0x87: // XCHG Ev, Gv
                return this.opCode(OpCode.XCHG).arithmeticOperands(first - 0x86).done();

            case 0x88: // MOV Eb, Gb
            case 0x89: // MOV Ev, Gv
            case 0x8A: // MOV Gb, Eb
            case 0x8B: // MOV Gv, Ev
                return this.opCode(OpCode.MOV).arithmeticOperands(first - 0x88).done();

            case 0x8C: // MOV Ev, Sw
                return this.opCode(OpCode.MOV).modrmOperand(this._operandSize).regOperand(Size.Int16, OperandFlags.Segment).done();

            case 0x8D: // LEA Gv, M
                return this.opCode(OpCode.LEA).regOperand(this._operandSize).modrmOperand(this._operandSize, OperandFlags.MustBeMemory | OperandFlags.DontDereference).done();

            case 0x8E: // MOV Sw, Ew 
                return this.opCode(OpCode.MOV).regOperand(Size.Int16, OperandFlags.Segment).modrmOperand(Size.Int16).done();

            case 0x8F: // POP Ev
                return this.opCode(OpCode.POP).modrmOperand(this._operandSize).done();

            case 0x90: // NOP
                return this.opCode(OpCode.NOP).done();

            case 0x91: // XCHG eAX, eCX
            case 0x92: // XCHG eAX, eDX
            case 0x93: // XCHG eAX, eBX
            case 0x94: // XCHG eAX, eSP
            case 0x95: // XCHG eAX, eBP
            case 0x96: // XCHG eAX, eSI
            case 0x97: // XCHG eAX, eDI
                return this.opCode(OpCode.XCHG).encodedRegisterOperand(0, this._operandSize).encodedRegisterOperand(first - 0x90, this._operandSize).done();

            case 0x98: // CBW
                return this.opCode(OpCode.CBW).done();

            case 0x99: // CWD
                return this.opCode(OpCode.CWD).done();

            case 0x9A: // CALL Ap
                return this.opCode(OpCode.CALL).callOperand(OperandFlags.Segment).done();

            case 0x9B: // WAIT
                return this.opCode(OpCode.WAIT).done();

            case 0x9C: // PUSHF Fv
                return this.opCode(OpCode.PUSHF).done();

            case 0x9D: // POPF Fv
                return this.opCode(OpCode.POPF).done();

            case 0x9E: // SAHF
                return this.opCode(OpCode.SAHF).done();

            case 0x9F: // LAHF
                return this.opCode(OpCode.LAHF).done();

            case 0xA0: // MOV AL, Ob
            case 0xA1: // MOV eAX, Ov
                return this.opCode(OpCode.MOV).encodedRegisterOperand(0, this.decodeOperandSize(first)).offsetOperand(this.decodeOperandSize(first)).done();

            case 0xA2: // MOV Ob, AL
            case 0xA3: // MOV Ov, eAX
                return this.opCode(OpCode.MOV).offsetOperand(this.decodeOperandSize(first)).encodedRegisterOperand(0, this.decodeOperandSize(first)).done();

            case 0xA4: // MOVSB Xb, Yb
            case 0xA5: // MOVSW/D Xv, Yv
                return this.opCode(OpCode.MOVS).dssiOperand(this.decodeOperandSize(first)).esdiOperand(this.decodeOperandSize(first)).done();

            case 0xA6: // CMPSB Xb, Yb
            case 0xA7: // CMPSW/D Xv, Yv
                return this.opCode(OpCode.CMPS).dssiOperand(this.decodeOperandSize(first)).esdiOperand(this.decodeOperandSize(first)).done();

            case 0xA8: // TEST AL, Ib
            case 0xA9: // TEST eAX, Iz
                return this.opCode(OpCode.TEST).encodedRegisterOperand(0, this.decodeOperandSize(first)).immediateOperand(this.decodeOperandSize(first)).done();

            case 0xAA: // STOSB Yb, AL
            case 0xAB: // STOSD/W Yv, eAX
                return this.opCode(OpCode.STOS).esdiOperand(this.decodeOperandSize(first)).encodedRegisterOperand(0, this.decodeOperandSize(first)).done();

            case 0xAC: // LODSB AL, Xb
            case 0xAD: // LODSD/W eAX, Xv
                return this.opCode(OpCode.LODS).encodedRegisterOperand(0, this.decodeOperandSize(first)).dssiOperand(this.decodeOperandSize(first)).done();

            case 0xAE: // SCASB AL, Xb
            case 0xAF: // SCASD/W eAX, Xv
                return this.opCode(OpCode.SCAS).encodedRegisterOperand(0, this.decodeOperandSize(first)).dssiOperand(this.decodeOperandSize(first)).done();

            case 0xB0: // MOV AL, Ib
            case 0xB1: // MOV CL, Ib
            case 0xB2: // MOV DL, Ib
            case 0xB3: // MOV BL, Ib
            case 0xB4: // MOV AH, Ib
            case 0xB5: // MOV CH, Ib
            case 0xB6: // MOV DH, Ib
            case 0xB7: // MOV BH, Ib
                return this.opCode(OpCode.MOV).encodedRegisterOperand(first - 0xB0, Size.Int8).immediateOperand(Size.Int8).done();

            case 0xB8: // MOV eAX, Iz
            case 0xB9: // MOV eCX, Iz
            case 0xBA: // MOV eDX, Iz
            case 0xBB: // MOV eBX, Iz
            case 0xBC: // MOV eSP, Iz
            case 0xBD: // MOV eBP, Iz
            case 0xBE: // MOV eSI, Iz
            case 0xBF: // MOV eDI, Iz
                return this.opCode(OpCode.MOV).encodedRegisterOperand(first - 0xB8, this._operandSize).immediateOperand(this._operandSize).done();

            case 0xC0: // Group 2 Eb, Ib
            case 0xC1: // Group 2 Ev, Ib
                return this.group2OpCode().modrmOperand(this.decodeOperandSize(first)).immediateOperand(Size.Int8).done();

            case 0xC2: // near RET Iw
                return this.near().opCode(OpCode.RET).immediateOperand(Size.Int16).done();

            case 0xC3: // near RET
                return this.near().opCode(OpCode.RET).done();

            case 0xC4: // LES Gv, Mp
                return this.opCode(OpCode.LES).regOperand(this._operandSize).modrmOperand(this._operandSize, OperandFlags.MustBeMemory).done();

            case 0xC5: // LDS Gv, Mp
                return this.opCode(OpCode.LDS).regOperand(this._operandSize).modrmOperand(this._operandSize, OperandFlags.MustBeMemory).done();

            case 0xC6: // MOV Eb, Ib
            case 0xC7: // MOV Ev, Iz
                return this.opCode(OpCode.MOV).modrmOperand(this.decodeOperandSize(first)).immediateOperand(this.decodeOperandSize(first)).done();

            case 0xC8: // ENTER Iw, Ib
                return this.opCode(OpCode.ENTER).immediateOperand(Size.Int16).immediateOperand(Size.Int8).done();

            case 0xC9: // LEAVE
                return this.opCode(OpCode.LEAVE).done();

            case 0xCA: // far RET Iw
                return this.opCode(OpCode.RET).immediateOperand(Size.Int16).done();

            case 0xCB: // far RET
                return this.opCode(OpCode.RET).done();

            case 0xCC: // INT 3
                return this.opCode(OpCode.INT).literalOperand(3).done();

            case 0xCD: // INT Ib
                return this.opCode(OpCode.INT).immediateOperand(Size.Int8).done();

            case 0xCE: // INTO
                return this.opCode(OpCode.INTO).done();

            case 0xCF: // IRET
                return this.opCode(OpCode.IRET).done();

            case 0xD0: // Group 2 Eb, 1
            case 0xD1: // Group 2 Ev, 1
                return this.group2OpCode().modrmOperand(this.decodeOperandSize(first)).literalOperand(1).done();

            case 0xD2: // Group 2 Eb, CL
            case 0xD3: // Group 2 Ev, CL
                return this.group2OpCode().modrmOperand(this.decodeOperandSize(first)).registerOperand(Register.CL).done();
            
            case 0xD4: // AAM
                return this.opCode(OpCode.AAM).done();

            case 0xD5: // AAD
                return this.opCode(OpCode.AAD).done();

            case 0xD6: // Unused
                break;

            case 0xD7: // XLAT
                return this.opCode(OpCode.XLAT).done();

            case 0xD8: // ESC
            case 0xD9: // ESC
            case 0xDA: // ESC
            case 0xDB: // ESC
            case 0xDC: // ESC
            case 0xDD: // ESC
            case 0xDE: // ESC
            case 0xDF: // ESC
                return this.escape(first - 0xD8);

            case 0xE0: // LOOPNE Jb
                return this.opCode(OpCode.LOOPNE).displacementOperand(Size.Int8).done();

            case 0xE1: // LOOPE Jb
                return this.opCode(OpCode.LOOPE).displacementOperand(Size.Int8).done();

            case 0xE2: // LOOP Jb
                return this.opCode(OpCode.LOOP).displacementOperand(Size.Int8).done();

            case 0xE3: // JCXZ Jb
                return this.opCode(OpCode.JCXZ).displacementOperand(Size.Int8).done();

            case 0xE4: // IN AL, Ib
            case 0xE5: // IN eAX, Ib
                return this.opCode(OpCode.IN).encodedRegisterOperand(0, this.decodeOperandSize(first)).immediateOperand(Size.Int8).done();

            case 0xE6: // OUT Ib, AL
            case 0xE7: // OUT Ib, eAX
                return this.opCode(OpCode.OUT).immediateOperand(Size.Int8).encodedRegisterOperand(0, this.decodeOperandSize(first)).done();

            case 0xE8: // CALL Av
                return this.opCode(OpCode.CALL).callOperand().done();

            case 0xE9: // JNP Jv
                return this.opCode(OpCode.JNP).displacementOperand(this._operandSize).done();

            case 0xEA: // JNP Ap
                return this.opCode(OpCode.JNP).callOperand(OperandFlags.Segment).done();

            case 0xEB: // JNP Jb
                return this.opCode(OpCode.JNP).displacementOperand(Size.Int8).done();

            case 0xEC: // IN AL, DX
            case 0xED: // IN eAX, DX
                return this.opCode(OpCode.IN).encodedRegisterOperand(0, this.decodeOperandSize(first)).registerOperand(Register.DX).done();

            case 0xEE: // OUT DX, AL
            case 0xEF: // OUT DX, eAX
                return this.opCode(OpCode.OUT).registerOperand(Register.DX).encodedRegisterOperand(0, this.decodeOperandSize(first)).done();

            case 0xF0: // LOCK prefix
                return this.locked().firstByte();

            case 0xF1: // Unused
                break;

            case 0xF2: // REPNE prefix
                return this.repeatType(RepeatType.NotEqual).firstByte();

            case 0xF3: // REP/REPE prefix
                return this.repeatType(RepeatType.Equal).firstByte();

            case 0xF4: // HLT
                return this.opCode(OpCode.HLT).done();

            case 0xF5: // CMC
                return this.opCode(OpCode.CMC).done();

            case 0xF6: // Unary Group 3 Eb
            case 0xF7: // Unary Group 3 Ev
                return this.group3(first);

            case 0xF8: // CLC
                return this.opCode(OpCode.CLC).done();

            case 0xF9: // STC
                return this.opCode(OpCode.STC).done();

            case 0xFA: // CLI
                return this.opCode(OpCode.CLI).done();

            case 0xFB: // STI
                return this.opCode(OpCode.STI).done();

            case 0xFC: // CLD
                return this.opCode(OpCode.CLD).done();

            case 0xFD: // STD
                return this.opCode(OpCode.STD).done();

            case 0xFE: // INC/DEC Group 4
                return this.group4OpCode().modrmOperand(Size.Int8).done();

            case 0xFF: // INC/DEC Group 5
                return this.group5();
        }

        throw new LayoutError("invalid instruction");
    }

    public disassemble(reader: IByteReader): Instruction {
        return this.reset(reader).firstByte();
    }
}