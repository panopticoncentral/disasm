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
    AAS,
    ADD,
    ADC,
    AND,
    ARPL,
    BOUND,
    BTC,
    BTR,
    BTS,
    CMP,
    DAA,
    DAS,
    DEC,
    INC,
    IMUL,
    INS,
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
    LEA,
    MOV,
    NEG,
    NOT,
    OR,
    OUTS,
    POP,
    POPA,
    PUSH,
    PUSHA,
    SBB,
    SUB,
    TEST,
    XCHG,
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
    Repeat
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

    constructor(opCode: OpCode, locked: boolean, operand1: Operand = null, operand2: Operand = null, operand3: Operand = null) {
        this._opCode = opCode;
        this._locked = locked;
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

    private immediateOperand(reader: IByteReader, size: Size): ImmediateOperand {
        var value: number = 0;
        for (var index: number = 0; index < <number>size; index++) {
            value += reader.read() << (8 * index);
        }

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
            return this.registerOperand((reg * 3) + state.operandSize);
        }
        else {
            return this.segmentOperand(reg);
        }
    }

    private decodeSib(reader: IByteReader, sib: number): Operand {
        var scale: number = (sib >> 6) & 0x3;
        var index: number = (sib >> 3) & 0x7;
        var base: number = sib & 0x7;

        var baseRegister: Register = <Register>((base * 3) + 3);
        var indexRegister: Register = <Register>((index * 3) + 3);
        var scaleValue: number = 1 << scale;
        var scaleOperand: ScaleOperand = null;

        if (indexRegister != Register.ESP && scale > 0) {
            scaleOperand = this.registerOperand(indexRegister).scaleBy(scaleValue);
        }

        var baseOperand: RegisterOperand = this.registerOperand(baseRegister);

        if (baseRegister != Register.EBP) {
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
            return this.registerOperand((rm * 3) + state.operandSize);
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
            var rmRegister: Register = <Register>((rm * 3) + 3);

            if (rmRegister == Register.ESP) {
                result = this.decodeSib(reader, reader.read());
            }
            else if (rmRegister == Register.EBP && mod == 0x00) {
                result = this.displacementOperand(reader, Size.Int32);
            }
            else {
                result = this.registerOperand(rmRegister);
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

    // Default is: Ev, Gv
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

        return new Instruction(opCode, state.isLocked, destination, source);
    }

    private arithmeticOperation(opCode: OpCode, index: number, reader: IByteReader, state: InstructionState): Instruction {
        if ((index & 0x1) == 0x1) {
            state.setOperandSize(Size.Int8);
        }

        // AL/eAX, Ib/v
        if ((index & 0x4) == 0x4) {
                return new Instruction(
                opCode,
                state.isLocked,
                this.registerOperand(Register.AL + state.operandSize),
                this.immediateOperand(reader, state.operandSize));
        }

        if ((index & 0x2) == 0x2) {
            state.reverseOperands();
        }

        return this.modrmOperation(opCode, reader, state);
    }

    private registerOperation(opCode: OpCode, index: number, state: InstructionState): Instruction {
        var register: Register = <Register>((index * 3) + (state.operandSize == Size.Int16 ? 2 : 3));
        return new Instruction(opCode, state.isLocked, this.registerOperand(register));
    }

    private imulOperation(reader: IByteReader, state: InstructionState, immediateSize: Size): Instruction {
        var modrm: number = reader.read();

        // Gv, Ev, Iz/b
        return new Instruction(
            OpCode.IMUL,
            state.isLocked,
            this.decodeReg(modrm, state),
            this.decodeModrm(reader, modrm, state),
            this.immediateOperand(reader, immediateSize)
        );
    }

    private firstByte(reader: IByteReader, state: InstructionState): Instruction {
        var instr: Instruction;
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
                return new Instruction(OpCode.PUSH, state.isLocked, this.segmentOperand(Segment.ES));

            case 0x07: // POP ES
                return new Instruction(OpCode.POP, state.isLocked, this.segmentOperand(Segment.ES));

            case 0x08: // OR Eb, Gb
            case 0x09: // OR Ev, Gv
            case 0x0A: // OR Gb, Eb
            case 0x0B: // OR Gv, Ev
            case 0x0C: // OR AL, Ib
            case 0x0D: // OR rAX, Iz
                return this.arithmeticOperation(OpCode.OR, opcode - 0x8, reader, state);

            case 0x0E: // PUSH CS
                return new Instruction(OpCode.PUSH, state.isLocked, this.segmentOperand(Segment.CS));

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
                return new Instruction(OpCode.PUSH, state.isLocked, this.segmentOperand(Segment.SS));

            case 0x17: // POP SS
                return new Instruction(OpCode.POP, state.isLocked, this.segmentOperand(Segment.SS));

            case 0x18: // SBB Eb, Gb
            case 0x19: // SBB Ev, Gv
            case 0x1A: // SBB Gb, Eb
            case 0x1B: // SBB Gv, Ev
            case 0x1C: // SBB AL, Ib
            case 0x1D: // SBB rAX, Iz
                return this.arithmeticOperation(OpCode.SBB, opcode - 0x18, reader, state);

            case 0x1E: // PUSH DS
                return new Instruction(OpCode.PUSH, state.isLocked, this.segmentOperand(Segment.DS));

            case 0x1F: // POP DS
                return new Instruction(OpCode.POP, state.isLocked, this.segmentOperand(Segment.DS));

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
                return new Instruction(OpCode.DAA, state.isLocked);

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
                return new Instruction(OpCode.DAS, state.isLocked);

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
                return new Instruction(OpCode.AAA, state.isLocked);

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
                return new Instruction(OpCode.AAS, state.isLocked);

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
                return new Instruction(OpCode.PUSHA, state.isLocked);

            case 0x61: // POPA
                return new Instruction(OpCode.POPA, state.isLocked);

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
                return new Instruction(OpCode.PUSH, state.isLocked, this.immediateOperand(reader, this._sizeDefault));

            case 0x69: // IMUL Gv, Ev, Iz
                return this.imulOperation(reader, state, this._sizeDefault);

            case 0x6A: // PUSH Ib
                return new Instruction(OpCode.PUSH, state.isLocked, this.immediateOperand(reader, Size.Int8));

            case 0x6B: // IMUL Gv, Ev, Ib
                return this.imulOperation(reader, state, Size.Int8);

            case 0x6C: // INSB Yb, DX
                return new Instruction(OpCode.INS, state.isLocked,
                    this.registerOperand(Register.DI).indirect(Size.Int8, Segment.ES),
                    this.registerOperand(Register.DX));

            case 0x6D: // INSW/INSD Yz, DX
                return new Instruction(OpCode.INS, state.isLocked,
                    this.registerOperand(Register.DI).indirect(this._sizeDefault, Segment.ES),
                    this.registerOperand(Register.DX));

            case 0x6E: // OUTSB DX, Xb
                return new Instruction(OpCode.OUTS, state.isLocked,
                    this.registerOperand(Register.DX),
                    this.registerOperand(Register.SI).indirect(Size.Int8, Segment.DS));

            case 0x6F: // OUTSW/OUTSD DX, Xz
                return new Instruction(OpCode.OUTS, state.isLocked,
                    this.registerOperand(Register.DX),
                    this.registerOperand(Register.SI).indirect(this._sizeDefault, Segment.DS));

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
                return new Instruction(OpCode.JO + (opcode - 0x70), state.isLocked, this.displacementOperand(reader, Size.Int8));

            case 0x80: // Group 1 Eb, Ib
            case 0x81: // Group 1 Ev, Iv
            case 0x82: // INVALID (will be handled in Group 1)
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
            case 0x91: // XCHG eAX, eCX
            case 0x92: // XCHG eAX, eDX
            case 0x93: // XCHG eAX, eBX
            case 0x94: // XCHG eAX, eSP
            case 0x95: // XCHG eAX, eBP
            case 0x96: // XCHG eAX, eSI
            case 0x97: // XCHG eAX, eDI
            case 0x98: // CBW
            case 0x99: // CWD
            case 0x9A: // CALL Ap
            case 0x9B: // WAIT
            case 0x9C: // PUSHF Fv
            case 0x9D: // POPF Fv
            case 0x9E: // SAHF
            case 0x9F: // LAHF

            case 0xF0: // LOCK prefix
                return this.firstByte(reader, state.setIsLocked());

            case 0xF2: // REPNE prefix
                return this.firstByte(reader, state.setIsNegatedRepeat());

            case 0xF3: // REP/REPE prefix
                return this.firstByte(reader, state.setIsRepeat());
        }

        throw new LayoutError("invalid opcode");
    }

    public disassemble(reader: IByteReader): Instruction {
        return this.firstByte(reader, new InstructionState(this._sizeDefault));
    }
}