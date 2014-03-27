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
    BTC,
    BTR,
    BTS,
    CALL,
    CBW,
    CLC,
    CLD,
    CLI,
    CMC,
    CMP,
    CMPS,
    CWD,
    DAA,
    DAS,
    DEC,
    ENTER,
    HLT,
    INC,
    IMUL,
    IN,
    INS,
    INT,
    INTO,
    IRET,
    JCXZ,
    JO,
    JNO,
    JB,
    JNB,
    JZ,
    JNZ,
    JBE,
    JNBE,
    JS,
    JNS,
    JP,
    JNP,
    JL,
    JNL,
    JLE,
    JNLE,
    LAHF,
    LDS,
    LEA,
    LEAVE,
    LES,
    LODS,
    LOOP,
    LOOPE,
    LOOPNE,
    MOV,
    MOVS,
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
    RET,
    SAHF,
    SBB,
    SCAS,
    STC,
    STD,
    STI,
    STOS,
    SUB,
    TEST,
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
    private _locked: boolean;
    private _isNear: boolean;
    private _operand1: Operand;
    private _operand2: Operand;
    private _operand3: Operand;

    private validateLock(locked: boolean): void {
        if (!locked) {
            return;
        }

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

    constructor(opCode: OpCode, locked: boolean, isNear: boolean, operand1: Operand = null, operand2: Operand = null, operand3: Operand = null) {
        this._opCode = opCode;
        this._locked = locked;
        this._isNear = isNear;
        this._operand1 = operand1;
        this._operand2 = operand2;
        this._operand3 = operand3;

        this.validateLock(locked);
    }

    public get opCode(): OpCode {
        return this._opCode;
    }

    public get locked(): boolean {
        return this._locked;
    }

    public get isNear(): boolean {
        return this._isNear;
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

class InstructionState {
    private _addressMode: Size;
    private _addressModeOverridden: boolean;
    private _operandSize: Size;
    private _operandSizeOverridden: boolean;
    private _segmentOverride: Segment;
    private _isLocked: boolean;
    private _isRepeat: boolean;
    private _isNegatedRepeat: boolean;
    private _operandsReversed: boolean;
    private _isSegmentOperation: boolean;
    private _sourceMustBeMemory: boolean;
    private _dontDereferenceSource: boolean;

    constructor(sizeDefault: Size) {
        this._addressMode = sizeDefault;
        this._addressModeOverridden = false;
        this._operandSize = sizeDefault;
        this._operandSizeOverridden = false;
        this._segmentOverride = Segment.None;
        this._isLocked = false;
        this._isRepeat = false;
        this._isNegatedRepeat = false;
        this._operandsReversed = false;
        this._isSegmentOperation = false;
        this._sourceMustBeMemory = false;
        this._dontDereferenceSource = false;
    }

    public get addressMode(): Size {
        return this._addressMode;
    }

    public get operandSize(): Size {
        return this._operandSize;
    }

    public get segmentOverride(): Segment {
        return this._segmentOverride;
    }

    public get isLocked(): boolean {
        return this._isLocked;
    }

    public get isRepeat(): boolean {
        return this._isRepeat;
    }

    public get isNegatedRepeat(): boolean {
        return this._isNegatedRepeat;
    }

    public get operandsReversed(): boolean {
        return this._operandsReversed;
    }

    public get isSegmentOperation(): boolean {
        return this._isSegmentOperation;
    }

    public get sourceMustBeMemory(): boolean {
        return this._sourceMustBeMemory;
    }

    public get dontDereferenceSource(): boolean {
        return this._dontDereferenceSource;
    }

    public addressModeOverride(): InstructionState {
        if (this._addressModeOverridden) {
            throw new LayoutError("multiple address mode prefixes");
        }
        else {
            this._addressModeOverridden = true;
        }

        this._addressMode = this._addressMode == Size.Int16 ?
        Size.Int32 : Size.Int16;
        return this;
    }

    public setAddressMode(size: Size): InstructionState {
        this._addressMode = size;
        return this;
    }

    public operandSizeOverride(): InstructionState {
        if (this._operandSizeOverridden) {
            throw new LayoutError("multiple operand size prefixes");
        }
        else {
            this._operandSizeOverridden = true;
        }

        this._operandSize = this._operandSize == Size.Int16 ? Size.Int32 : Size.Int16;
        return this;
    }

    public setOperandSize(size: Size): InstructionState {
        this._operandSize = size;
        return this;
    }

    public setSegmentOverride(segment: Segment): InstructionState {
        if (this._segmentOverride != Segment.None) {
            throw new LayoutError("multiple segment override prefixes");
        }

        this._segmentOverride = segment;
        return this;
    }

    public setIsLocked(): InstructionState {
        if (this._isLocked) {
            throw new LayoutError("multiple LOCK prefixes");
        }

        this._isLocked = true;
        return this;
    }

    public setIsRepeat(): InstructionState {
        if (this._isRepeat || this._isNegatedRepeat) {
            throw new LayoutError("multiple REP prefixes");
        }

        this._isRepeat = true;
        return this;
    }

    public setIsNegatedRepeat(): InstructionState {
        if (this._isRepeat || this._isNegatedRepeat) {
            throw new LayoutError("multiple REP prefixes");
        }

        this._isNegatedRepeat = true;
        return this;
    }

    public reverseOperands(): InstructionState {
        if (this._operandsReversed) {
            throw new LayoutError("unexpected");
        }
        this._operandsReversed = true;
        return this;
    }

    public setSegmentOperation(): InstructionState {
        if (this._isSegmentOperation) {
            throw new LayoutError("unexpected");
        }
        this._isSegmentOperation = true;
        return this;
    }

    public setSourceMustBeMemory(): InstructionState {
        if (this._sourceMustBeMemory) {
            throw new LayoutError("unexpected");
        }
        this._sourceMustBeMemory = true;
        return this;
    }

    public setDontDereferenceSource(): InstructionState {
        if (this._dontDereferenceSource) {
            throw new LayoutError("unexpected");
        }
        this._dontDereferenceSource = true;
        return this;
    }
}

export class Dissassembler {
    private _sizeDefault: Size;

    constructor(sizeDefault: Size) {
        if (sizeDefault != Size.Int16 && sizeDefault != Size.Int32) {
            throw new Error("invalid default size");
        }

        this._sizeDefault = sizeDefault;
    }

    private segmentOverride(segment: Segment, reader: IByteReader, state: InstructionState): Instruction {
        return this.firstByte(reader, state.setSegmentOverride(segment));
    }

    private readImmediate(reader: IByteReader, size: Size): number {
        var value: number = 0;
        for (var index: number = 0; index < <number>size; index++) {
            value += reader.read() << (8 * index);
        }
        return value;
    }

    private immediateOperand(reader: IByteReader, size: Size): ImmediateOperand {
        return new ImmediateOperand(this.readImmediate(reader, size), size);
    }

    private literalOperand(value: number, size: Size): ImmediateOperand {
        return new ImmediateOperand(value, size);
    }

    private displacementOperand(reader: IByteReader, size: Size): ImmediateOperand {
        var value: number = 0;
        for (var index: number = 0; index < <number>size - 1; index++) {
            value += reader.read() << (8 * index);
        }

        var lastByte: number = reader.read();
        value += (lastByte & ~0x80) << (8 * index);

        if (lastByte & 0x80) {
            value = -value;
        }

        return new ImmediateOperand(value, size);
    }

    private registerOperand(reg: Register): RegisterOperand {
        return RegisterOperand.getRegister(reg);
    }

    private segmentOperand(seg: Segment): SegmentOperand {
        return SegmentOperand.getSegment(seg);
    }

    private chooseOperand(opcode: number, state: InstructionState): Size {
        if ((opcode & 0x1) == 0x1) {
            return state.operandSize;
        }

        return Size.Int8;
    }

    private decodeRegister(reg: number, state: InstructionState): RegisterOperand {
        return RegisterOperand.getRegister((reg * 3) + state.operandSize);
    }

    private decodeReg(modrm: number, state: InstructionState): Operand {
        var reg: number = (modrm >> 3) & 0x7;
        
        if ((state.isLocked && state.operandsReversed) ||
            (state.sourceMustBeMemory && !state.operandsReversed)) {
            throw new LayoutError("expected memory operand");
        }

        if (state.dontDereferenceSource && state.operandsReversed) {
            throw new LayoutError("unexpected");
        }

        if (!state.isSegmentOperation) {
            return this.decodeRegister(reg, state);
        }
        else {
            return this.segmentOperand(reg);
        }
    }

    private decodeSib(reader: IByteReader, sib: number, state: InstructionState): Operand {
        var scale: number = (sib >> 6) & 0x3;
        var index: number = (sib >> 3) & 0x7;
        var base: number = sib & 0x7;

        var scaleValue: number = 1 << scale;
        var scaleOperand: ScaleOperand = null;

        if (index != 0x4 && scale > 0) {
            scaleOperand = this.decodeRegister(index, state).scaleBy(scaleValue);
        }

        var baseOperand: RegisterOperand = this.decodeRegister(base, state);

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
                displacementOperand = this.displacementOperand(reader, Size.Int32);
                baseOperand = null;
                break;

            case 0x2:
                displacementOperand = this.displacementOperand(reader, Size.Int8);
                break;

            case 0x4:
                displacementOperand = this.displacementOperand(reader, Size.Int32);
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

    private decodeModrm(reader: IByteReader, modrm: number, state: InstructionState): Operand {
        var mod: number = modrm >> 6;
        var rm: number = modrm & 0x7;
        var result: Operand = null;

        if (mod == 0x3) {
            if ((state.isLocked && !state.operandsReversed) ||
                (state.sourceMustBeMemory && state.operandsReversed)) {
                throw new LayoutError("expected memory operand");
            }
            return this.decodeRegister(rm, state);
        }

        if (state.addressMode == Size.Int16) {
            switch (rm) {
                case 0x0:
                    result = this.registerOperand(Register.BX).add(this.registerOperand(Register.SI));
                    break;

                case 0x1:
                    result = this.registerOperand(Register.BX).add(this.registerOperand(Register.DI));
                    break;

                case 0x2:
                    result = this.registerOperand(Register.BP).add(this.registerOperand(Register.SI));
                    break;

                case 0x3:
                    result = this.registerOperand(Register.BP).add(this.registerOperand(Register.DI));
                    break;

                case 0x4:
                    result = this.registerOperand(Register.SI);
                    break;

                case 0x5:
                    result = this.registerOperand(Register.DI);
                    break;

                case 0x6:
                    if (mod == 0x0) {
                        result = this.displacementOperand(reader, Size.Int16);
                    }
                    else {
                        result = this.registerOperand(Register.BP);
                    }
                    break;

                case 0x7:
                    result = this.registerOperand(Register.BX);
                    break;
            }
        }
        else {
            if (rm == 0x4) {
                result = this.decodeSib(reader, reader.read(), state);
            }
            else if (rm == 0x5 && mod == 0x00) {
                result = this.displacementOperand(reader, Size.Int32);
            }
            else {
                result = this.decodeRegister(rm, state);
            }
        }

        switch (mod) {
            case 0x0:
                // Nothing
                break;

            case 0x1:
                result = result.add(this.displacementOperand(reader, Size.Int8));
                break;

            case 0x2:
                result = result.add(this.displacementOperand(reader, state.addressMode));
                break;
        }

        return state.dontDereferenceSource ? result : result.indirect(state.operandSize, state.segmentOverride);
    }

    private operation(opCode: OpCode, state: InstructionState, operand1: Operand = null, operand2: Operand = null, operand3: Operand = null): Instruction {
        return new Instruction(opCode, state.isLocked, false, operand1, operand2, operand3);
    }

    private nearOperation(opCode: OpCode, state: InstructionState, operand1: Operand = null, operand2: Operand = null, operand3: Operand = null): Instruction {
        return new Instruction(opCode, state.isLocked, true, operand1, operand2, operand3);
    }

    // Default is: E, G
    private modrmOperation(opCode: OpCode, reader: IByteReader, state: InstructionState): Instruction {
        var source: Operand;
        var destination: Operand;
        var modrm: number = reader.read();

        if (!state.operandsReversed) {
            destination = this.decodeModrm(reader, modrm, state);
            source = this.decodeReg(modrm, state);
        }
        else {
            destination = this.decodeReg(modrm, state);
            source = this.decodeModrm(reader, modrm, state);
        }

        return this.operation(opCode, state, destination, source);
    }

    private arithmeticOperation(opCode: OpCode, index: number, reader: IByteReader, state: InstructionState): Instruction {
        if ((index & 0x1) == 0x1) {
            state.setOperandSize(Size.Int8);
        }

        // AL/eAX, Ib/v
        if ((index & 0x4) == 0x4) {
                return this.operation(
                opCode,
                state,
                this.decodeRegister(0, state),
                this.immediateOperand(reader, state.operandSize));
        }

        if ((index & 0x2) == 0x2) {
            state.reverseOperands();
        }

        return this.modrmOperation(opCode, reader, state);
    }

    private registerOperation(opCode: OpCode, index: number, state: InstructionState): Instruction {
        return this.operation(opCode, state, this.decodeRegister(index, state));
    }

    private imulOperation(reader: IByteReader, state: InstructionState, immediateSize: Size): Instruction {
        var modrm: number = reader.read();

        // Gv, Ev, Iz/b
        return this.operation(
            OpCode.IMUL,
            state,
            this.decodeReg(modrm, state),
            this.decodeModrm(reader, modrm, state),
            this.immediateOperand(reader, immediateSize)
        );
    }

    private callOperation(withSegment: boolean, reader: IByteReader, state: InstructionState): Instruction {
        var segmentValue: number = withSegment ? this.readImmediate(reader, Size.Int16) : state.segmentOverride;
        var offsetValue: number = this.readImmediate(reader, state.addressMode);
        return this.operation(OpCode.CALL, state, new CallOperand(segmentValue, offsetValue, state.addressMode));
    }

    private firstByte(reader: IByteReader, state: InstructionState): Instruction {
        var opcode: number = reader.read();

        switch (opcode) {
            case 0x00: // ADD Eb, Gb
            case 0x01: // ADD Ev, Gv
            case 0x02: // ADD Gb, Eb
            case 0x03: // ADD Gv, Ev
            case 0x04: // ADD AL, Ib
            case 0x05: // ADD rAX, Iz
                return this.arithmeticOperation(OpCode.ADD, opcode - 0x0, reader, state);

            case 0x06: // PUSH ES
                return this.operation(OpCode.PUSH, state, this.segmentOperand(Segment.ES));

            case 0x07: // POP ES
                return this.operation(OpCode.POP, state, this.segmentOperand(Segment.ES));

            case 0x08: // OR Eb, Gb
            case 0x09: // OR Ev, Gv
            case 0x0A: // OR Gb, Eb
            case 0x0B: // OR Gv, Ev
            case 0x0C: // OR AL, Ib
            case 0x0D: // OR rAX, Iz
                return this.arithmeticOperation(OpCode.OR, opcode - 0x8, reader, state);

            case 0x0E: // PUSH CS
                return this.operation(OpCode.PUSH, state, this.segmentOperand(Segment.CS));

            case 0x0F: // Two byte escape
                return this.twoByteEscape(reader, state);

            case 0x10: // ADC Eb, Gb
            case 0x11: // ADC Ev, Gv
            case 0x12: // ADC Gb, Eb
            case 0x13: // ADC Gv, Ev
            case 0x14: // ADC AL, Ib
            case 0x15: // ADC rAX, Iz
                return this.arithmeticOperation(OpCode.ADC, opcode - 0x10, reader, state);

            case 0x16: // PUSH SS
                return this.operation(OpCode.PUSH, state, this.segmentOperand(Segment.SS));

            case 0x17: // POP SS
                return this.operation(OpCode.POP, state, this.segmentOperand(Segment.SS));

            case 0x18: // SBB Eb, Gb
            case 0x19: // SBB Ev, Gv
            case 0x1A: // SBB Gb, Eb
            case 0x1B: // SBB Gv, Ev
            case 0x1C: // SBB AL, Ib
            case 0x1D: // SBB rAX, Iz
                return this.arithmeticOperation(OpCode.SBB, opcode - 0x18, reader, state);

            case 0x1E: // PUSH DS
                return this.operation(OpCode.PUSH, state, this.segmentOperand(Segment.DS));

            case 0x1F: // POP DS
                return this.operation(OpCode.POP, state, this.segmentOperand(Segment.DS));

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
                return this.operation(OpCode.DAA, state);

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
                return this.operation(OpCode.DAS, state);

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
                return this.operation(OpCode.AAA, state);

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
                return this.operation(OpCode.AAS, state);

            case 0x40: // INC eAX
            case 0x41: // INC eCX
            case 0x42: // INC eDX
            case 0x43: // INC eBX
            case 0x44: // INC eSP
            case 0x45: // INC eBP
            case 0x46: // INC eSI
            case 0x47: // INC eDI
                return this.registerOperation(OpCode.INC, opcode - 0x40, state);

            case 0x48: // DEC eAX
            case 0x49: // DEC eCX
            case 0x4A: // DEC eDX
            case 0x4B: // DEC eBX
            case 0x4C: // DEC eSP
            case 0x4D: // DEC eBP
            case 0x4E: // DEC eSI
            case 0x4F: // DEC eDI
                return this.registerOperation(OpCode.DEC, opcode - 0x48, state);

            case 0x50: // PUSH eAX
            case 0x51: // PUSH eCX
            case 0x52: // PUSH eDX
            case 0x53: // PUSH eBX
            case 0x54: // PUSH eSP
            case 0x55: // PUSH eBP
            case 0x56: // PUSH eSI
            case 0x57: // PUSH eDI
                return this.registerOperation(OpCode.PUSH, opcode - 0x50, state);

            case 0x58: // POP eAX
            case 0x59: // POP eCX
            case 0x5A: // POP eDX
            case 0x5B: // POP eBX
            case 0x5C: // POP eSP
            case 0x5D: // POP eBP
            case 0x5E: // POP eSI
            case 0x5F: // POP eDI
                return this.registerOperation(OpCode.POP, opcode - 0x58, state);

            case 0x60: // PUSHA
                return this.operation(OpCode.PUSHA, state);

            case 0x61: // POPA
                return this.operation(OpCode.POPA, state);

            case 0x62: // BOUND Gv, Ma
                return this.modrmOperation(OpCode.BOUND, reader, state.reverseOperands().setSourceMustBeMemory());

            case 0x63: // ARPL Ew, Gw
                return this.modrmOperation(OpCode.ARPL, reader, state.setOperandSize(Size.Int16).setAddressMode(Size.Int16));

            case 0x64: // FS segment override
                return this.segmentOverride(Segment.FS, reader, state);

            case 0x65: // GS segment override
                return this.segmentOverride(Segment.GS, reader, state);

            case 0x66: // Operand size prefix
                return this.firstByte(reader, state.operandSizeOverride());

            case 0x67: // Address size prefix
                return this.firstByte(reader, state.addressModeOverride());

            case 0x68: // PUSH Iz
                return this.operation(OpCode.PUSH, state, this.immediateOperand(reader, state.operandSize));

            case 0x69: // IMUL Gv, Ev, Iz
                return this.imulOperation(reader, state, state.operandSize);

            case 0x6A: // PUSH Ib
                return this.operation(OpCode.PUSH, state, this.immediateOperand(reader, Size.Int8));

            case 0x6B: // IMUL Gv, Ev, Ib
                return this.imulOperation(reader, state, Size.Int8);

            case 0x6C: // INSB Yb, DX
            case 0x6D: // INSW/INSD Yz, DX
                return this.operation(OpCode.INS, state,
                    this.registerOperand(Register.DI).indirect(this.chooseOperand(opcode, state), Segment.ES),
                    this.registerOperand(Register.DX));

            case 0x6E: // OUTSB DX, Xb
            case 0x6F: // OUTSW/OUTSD DX, Xz
                return this.operation(OpCode.OUTS, state,
                    this.registerOperand(Register.DX),
                    this.registerOperand(Register.SI).indirect(this.chooseOperand(opcode, state), Segment.DS));

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
                return this.operation(OpCode.JO + (opcode - 0x70), state, this.displacementOperand(reader, Size.Int8));

            case 0x80: // Group 1 Eb, Ib
            case 0x81: // Group 1 Ev, Iz
            case 0x82: // Unused (will be handled in Group 1)
            case 0x83: // Group 1 Ev, Ib
                return this.group1Operation(reader, opcode - 0x80, state);

            case 0x84: // TEST Eb, Gb
            case 0x85: // TEST Ev, Gv
                return this.arithmeticOperation(OpCode.TEST, opcode - 0x84, reader, state);

            case 0x86: // XCHG Eb, Gb
            case 0x87: // XCHG Ev, Gv
                return this.arithmeticOperation(OpCode.XCHG, opcode - 0x86, reader, state);

            case 0x88: // MOV Eb, Gb
            case 0x89: // MOV Ev, Gv
            case 0x8A: // MOV Gb, Eb
            case 0x8B: // MOV Gv, Ev
                return this.arithmeticOperation(OpCode.MOV, opcode - 0x88, reader, state);

            case 0x8C: // MOV Ev, Sw
                return this.modrmOperation(OpCode.MOV, reader, state.setSegmentOperation());

            case 0x8D: // LEA Gv, M
                return this.modrmOperation(OpCode.LEA, reader, state.reverseOperands().setSourceMustBeMemory().setDontDereferenceSource());

            case 0x8E: // MOV Sw, Ew 
                return this.modrmOperation(OpCode.MOV, reader, state.reverseOperands().setSegmentOperation());

            case 0x8F: // Group 1A POP
                return this.group1AOperation(reader, state);

            case 0x90: // NOP
                return this.operation(OpCode.NOP, state);

            case 0x91: // XCHG eAX, eCX
            case 0x92: // XCHG eAX, eDX
            case 0x93: // XCHG eAX, eBX
            case 0x94: // XCHG eAX, eSP
            case 0x95: // XCHG eAX, eBP
            case 0x96: // XCHG eAX, eSI
            case 0x97: // XCHG eAX, eDI
                return this.operation(OpCode.XCHG, state, this.decodeRegister(0, state), this.decodeRegister(opcode - 0x90, state));

            case 0x98: // CBW
                return this.operation(OpCode.CBW, state);

            case 0x99: // CWD
                return this.operation(OpCode.CWD, state);

            case 0x9A: // CALL Ap
                return this.callOperation(false, reader, state);

            case 0x9B: // WAIT
                return this.operation(OpCode.WAIT, state);

            case 0x9C: // PUSHF Fv
                return this.operation(OpCode.PUSHF, state);

            case 0x9D: // POPF Fv
                return this.operation(OpCode.POPF, state);

            case 0x9E: // SAHF
                return this.operation(OpCode.SAHF, state);

            case 0x9F: // LAHF
                return this.operation(OpCode.LAHF, state);

            case 0xA0: // MOV AL, Ob
            case 0xA1: // MOV eAX, Ov
                return this.operation(
                    OpCode.MOV,
                    state,
                    this.registerOperand(Register.AL + this.chooseOperand(opcode, state)),
                    this.immediateOperand(reader, state.addressMode).indirect(this.chooseOperand(opcode, state), state.segmentOverride));

            case 0xA2: // MOV Ob, AL
            case 0xA3: // MOV Ov, eAX
                return this.operation(
                    OpCode.MOV,
                    state,
                    this.immediateOperand(reader, state.addressMode).indirect(this.chooseOperand(opcode, state), state.segmentOverride),
                    this.registerOperand(Register.AL + this.chooseOperand(opcode, state)));

            case 0xA4: // MOVSB Xb, Yb
            case 0xA5: // MOVSW/D Xv, Yv
                return this.operation(
                    OpCode.MOVS,
                    state,
                    this.registerOperand(Register.SI).indirect(this.chooseOperand(opcode, state), Segment.DS),
                    this.registerOperand(Register.DI).indirect(this.chooseOperand(opcode, state), Segment.ES));

            case 0xA6: // CMPSB Xb, Yb
            case 0xA7: // CMPSW/D Xv, Yv
                return this.operation(
                    OpCode.CMPS,
                    state,
                    this.registerOperand(Register.SI).indirect(this.chooseOperand(opcode, state), Segment.DS),
                    this.registerOperand(Register.DI).indirect(this.chooseOperand(opcode, state), Segment.ES));

            case 0xA8: // TEST AL, Ib
            case 0xA9: // TEST eAX, Iz
                return this.operation(OpCode.TEST, state, this.registerOperand(Register.AL + this.chooseOperand(opcode, state)), this.immediateOperand(reader, this.chooseOperand(opcode, state)));

            case 0xAA: // STOSB Yb, AL
            case 0xAB: // STOSD/W Yv, eAX
                return this.operation(
                    OpCode.STOS,
                    state,
                    this.registerOperand(Register.DI).indirect(this.chooseOperand(opcode, state), Segment.ES),
                    this.registerOperand(Register.AL + this.chooseOperand(opcode, state)));

            case 0xAC: // LODSB AL, Xb
            case 0xAD: // LODSD/W eAX, Xv
                return this.operation(
                    OpCode.LODS,
                    state,
                    this.registerOperand(Register.AL + this.chooseOperand(opcode, state)),
                    this.registerOperand(Register.SI).indirect(this.chooseOperand(opcode, state), Segment.DS));

            case 0xAE: // SCASB AL, Xb
            case 0xAF: // SCASD/W eAX, Xv
                return this.operation(
                    OpCode.SCAS,
                    state,
                    this.registerOperand(Register.AL + this.chooseOperand(opcode, state)),
                    this.registerOperand(Register.SI).indirect(this.chooseOperand(opcode, state), Segment.DS));

            case 0xB0: // MOV AL, Ib
            case 0xB1: // MOV CL, Ib
            case 0xB2: // MOV DL, Ib
            case 0xB3: // MOV BL, Ib
            case 0xB4: // MOV AH, Ib
            case 0xB5: // MOV CH, Ib
            case 0xB6: // MOV DH, Ib
            case 0xB7: // MOV BH, Ib
                return this.operation(OpCode.MOV, state, this.decodeRegister(opcode - 0xB0, state.setOperandSize(Size.Int8)), this.immediateOperand(reader, Size.Int8));

            case 0xB8: // MOV eAX, Iz
            case 0xB9: // MOV eCX, Iz
            case 0xBA: // MOV eDX, Iz
            case 0xBB: // MOV eBX, Iz
            case 0xBC: // MOV eSP, Iz
            case 0xBD: // MOV eBP, Iz
            case 0xBE: // MOV eSI, Iz
            case 0xBF: // MOV eDI, Iz
                return this.operation(OpCode.MOV, state, this.decodeRegister(opcode - 0xB8, state), this.immediateOperand(reader, state.operandSize));

            case 0xC0: // Group 2 Eb, Ib
            case 0xC1: // Group 2 Ev, Ib
                return this.group2Operation(reader, state, opcode - 0xC0, this.immediateOperand(reader, Size.Int8));

            case 0xC2: // near RET Iw
                return this.nearOperation(OpCode.RET, state, this.immediateOperand(reader, Size.Int16));

            case 0xC3: // near RET
                return this.nearOperation(OpCode.RET, state);

            case 0xC4: // LES Gv, Mp
                return this.modrmOperation(OpCode.LES, reader, state.reverseOperands().setSourceMustBeMemory());

            case 0xC5: // LDS Gv, Mp
                return this.modrmOperation(OpCode.LDS, reader, state.reverseOperands().setSourceMustBeMemory());

            case 0xC6: // MOV Eb, Ib
            case 0xC7: // MOV Ev, Iz
                return this.operation(
                    OpCode.MOV,
                    state,
                    this.decodeModrm(reader, reader.read(), state),
                    this.immediateOperand(reader, state.operandSize));

            case 0xC8: // ENTER Iw, Ib
                return this.operation(OpCode.ENTER, state, this.immediateOperand(reader, Size.Int16), this.immediateOperand(reader, Size.Int8));

            case 0xC9: // LEAVE
                return this.operation(OpCode.LEAVE, state);

            case 0xCA: // far RET Iw
                return this.nearOperation(OpCode.RET, state, this.immediateOperand(reader, Size.Int16));

            case 0xCB: // far RET
                return this.nearOperation(OpCode.RET, state);

            case 0xCC: // INT 3
                return this.operation(OpCode.INT, state, this.literalOperand(3, Size.Int8));

            case 0xCD: // INT Ib
                return this.operation(OpCode.INT, state, this.immediateOperand(reader, Size.Int8));

            case 0xCE: // INTO
                return this.operation(OpCode.INTO, state);

            case 0xCF: // IRET
                return this.operation(OpCode.IRET, state);

            case 0xD0: // Group 2 Eb, 1
            case 0xD1: // Group 2 Ev, 1
                return this.group2Operation(reader, state, opcode - 0xC0, this.literalOperand(1, Size.Int8));

            case 0xD2: // Group 2 Eb, CL
            case 0xD3: // Group 2 Ev, CL
                return this.group2Operation(reader, state, opcode - 0xC0, this.registerOperand(Register.CL));
            
            case 0xD4: // AAM
                return this.operation(OpCode.AAM, state);

            case 0xD5: // AAD
                return this.operation(OpCode.AAD, state);

            case 0xD6: // Unused
                break;

            case 0xD7: // XLAT
                return this.operation(OpCode.XLAT, state);

            case 0xD8: // ESC
            case 0xD9: // ESC
            case 0xDA: // ESC
            case 0xDB: // ESC
            case 0xDC: // ESC
            case 0xDD: // ESC
            case 0xDE: // ESC
            case 0xDF: // ESC
                return this.fpOperation(reader, state, opcode - 0xD8);

            case 0xE0: // LOOPNE Jb
                return this.operation(OpCode.LOOPNE, state, this.displacementOperand(reader, Size.Int8));

            case 0xE1: // LOOPE Jb
                return this.operation(OpCode.LOOPE, state, this.displacementOperand(reader, Size.Int8));

            case 0xE2: // LOOP Jb
                return this.operation(OpCode.LOOP, state, this.displacementOperand(reader, Size.Int8));

            case 0xE3: // JCXZ Jb
                return this.operation(OpCode.JCXZ, state, this.displacementOperand(reader, Size.Int8));

            case 0xE4: // IN AL, Ib
            case 0xE5: // IN eAX, Ib
                return this.operation(OpCode.IN, state, this.registerOperand(Register.AL + this.chooseOperand(opcode, state)), this.immediateOperand(reader, Size.Int8));

            case 0xE6: // OUT Ib, AL
            case 0xE7: // OUT Ib, eAX
                return this.operation(OpCode.OUT, state, this.immediateOperand(reader, Size.Int8), this.registerOperand(Register.AL + this.chooseOperand(opcode, state)));

            case 0xE8: // CALL Av
                return this.callOperation(false, reader, state);

            case 0xE9: // JNP Jv
                return this.operation(OpCode.JNP, state, this.displacementOperand(reader, state.operandSize));

            case 0xEA: // JNP Ap
            case 0xEB: // JNP Jb
                return this.operation(OpCode.JNP, state, this.displacementOperand(reader, Size.Int8));

            case 0xEC: // IN AL, DX
            case 0xED: // IN eAX, DX
                return this.operation(OpCode.IN, state, this.registerOperand(Register.AL + this.chooseOperand(opcode, state)), this.registerOperand(Register.DX));

            case 0xEE: // OUT DX, AL
            case 0xEF: // OUT DX, eAX
                return this.operation(OpCode.OUT, state, this.registerOperand(Register.DX), this.registerOperand(Register.AL + this.chooseOperand(opcode, state)));

            case 0xF0: // LOCK prefix
                return this.firstByte(reader, state.setIsLocked());

            case 0xF1: // Unused
                break;

            case 0xF2: // REPNE prefix
                return this.firstByte(reader, state.setIsNegatedRepeat());

            case 0xF3: // REP/REPE prefix
                return this.firstByte(reader, state.setIsRepeat());

            case 0xF4: // HLT
                return this.operation(OpCode.HLT, state);

            case 0xF5: // CMC
                return this.operation(OpCode.CMC, state);

            case 0xF6: // Unary Group 3 Eb
            case 0xF7: // Unary Group 3 Ev
                return this.group3Operation(reader, state, opcode - 0xF6);

            case 0xF8: // CLC
                return this.operation(OpCode.CLC, state);

            case 0xF9: // STC
                return this.operation(OpCode.STC, state);

            case 0xFA: // CLI
                return this.operation(OpCode.CLI, state);

            case 0xFB: // STI
                return this.operation(OpCode.STI, state);

            case 0xFC: // CLD
                return this.operation(OpCode.CLD, state);

            case 0xFD: // STD
                return this.operation(OpCode.STD, state);

            case 0xFE: // INC/DEC Group 4
                return this.group4Operation(reader, state);

            case 0xFF: // Indirect Group 5
                return this.group5Operation(reader, state);
        }

        throw new LayoutError("invalid opcode");
    }

    public disassemble(reader: IByteReader): Instruction {
        return this.firstByte(reader, new InstructionState(this._sizeDefault));
    }
}