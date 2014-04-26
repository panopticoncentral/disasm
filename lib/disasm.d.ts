declare module "disasm" {
    export interface IByteReader {
        address(): number;
        read(): number;
    }

    export class LayoutError implements Error {
        public message: string;
        public name: string;

        constructor(message: string);
    }

    export enum OpCode {
        Invalid = 0,
        AAA = 1,
        AAD = 2,
        AAM = 3,
        AAS = 4,
        ADC = 5,
        ADD = 6,
        AND = 7,
        ARPL = 8,
        BOUND = 9,
        BSF = 10,
        BSR = 11,
        BT = 12,
        BTC = 13,
        BTR = 14,
        BTS = 15,
        CALL = 16,
        CBW = 17,
        CLC = 18,
        CLD = 19,
        CLI = 20,
        CLTS = 21,
        CMC = 22,
        CMP = 23,
        CMPS = 24,
        CWD = 25,
        DAA = 26,
        DAS = 27,
        DEC = 28,
        DIV = 29,
        ENTER = 30,
        F2XM1 = 31,
        FABS = 32,
        FADD = 33,
        FADDP = 34,
        FBLD = 35,
        FBSTP = 36,
        FCHS = 37,
        FCLEX = 38,
        FCMOVB = 39,
        FCMOVBE = 40,
        FCMOVE = 41,
        FCMOVNB = 42,
        FCMOVNBE = 43,
        FCMOVNE = 44,
        FCMOVNU = 45,
        FCMOVU = 46,
        FCOM = 47,
        FCOMI = 48,
        FCOMIP = 49,
        FCOMP = 50,
        FCOMPP = 51,
        FCOS = 52,
        FDECSTP = 53,
        FDIV = 54,
        FDIVP = 55,
        FDIVR = 56,
        FDIVRP = 57,
        FFREE = 58,
        FIADD = 59,
        FICOM = 60,
        FICOMP = 61,
        FIDIV = 62,
        FIDIVR = 63,
        FILD = 64,
        FIMUL = 65,
        FINCSTP = 66,
        FINIT = 67,
        FIST = 68,
        FISTP = 69,
        FISTTP = 70,
        FISUB = 71,
        FISUBR = 72,
        FLD = 73,
        FLD1 = 74,
        FLDCW = 75,
        FLDENV = 76,
        FLDL2E = 77,
        FLDL2T = 78,
        FLDLG2 = 79,
        FLDLN2 = 80,
        FLDPI = 81,
        FLDZ = 82,
        FMUL = 83,
        FMULP = 84,
        FNOP = 85,
        FPATAN = 86,
        FPREM = 87,
        FPREM1 = 88,
        FPTAN = 89,
        FRNDINT = 90,
        FRSTOR = 91,
        FSAVE = 92,
        FSCALE = 93,
        FSIN = 94,
        FSINCOS = 95,
        FSQRT = 96,
        FST = 97,
        FSTCW = 98,
        FSTENV = 99,
        FSTP = 100,
        FSTSW = 101,
        FSUB = 102,
        FSUBP = 103,
        FSUBR = 104,
        FSUBRP = 105,
        FTST = 106,
        FUCOM = 107,
        FUCOMI = 108,
        FUCOMIP = 109,
        FUCOMP = 110,
        FUCOMPP = 111,
        FXAM = 112,
        FXCH = 113,
        FXTRACT = 114,
        FYL2X = 115,
        FYL2XP1 = 116,
        HLT = 117,
        IDIV = 118,
        IMUL = 119,
        IN = 120,
        INC = 121,
        INS = 122,
        INT = 123,
        INTO = 124,
        IRET = 125,
        JCXZ = 126,
        JB = 127,
        JBE = 128,
        JL = 129,
        JLE = 130,
        JMP = 131,
        JNB = 132,
        JNBE = 133,
        JNL = 134,
        JNLE = 135,
        JNO = 136,
        JNP = 137,
        JNS = 138,
        JNZ = 139,
        JO = 140,
        JP = 141,
        JS = 142,
        JZ = 143,
        LAHF = 144,
        LAR = 145,
        LDS = 146,
        LEA = 147,
        LEAVE = 148,
        LES = 149,
        LFS = 150,
        LGDT = 151,
        LGS = 152,
        LIDT = 153,
        LMSW = 154,
        LODS = 155,
        LOOP = 156,
        LOOPE = 157,
        LOOPNE = 158,
        LSL = 159,
        LSS = 160,
        LTR = 161,
        MOV = 162,
        MOVS = 163,
        MOVSX = 164,
        MOVZX = 165,
        MUL = 166,
        NEG = 167,
        NOP = 168,
        NOT = 169,
        OR = 170,
        OUT = 171,
        OUTS = 172,
        POP = 173,
        POPA = 174,
        POPF = 175,
        PUSH = 176,
        PUSHA = 177,
        PUSHF = 178,
        RCL = 179,
        RCR = 180,
        RET = 181,
        ROL = 182,
        ROR = 183,
        SAHF = 184,
        SAR = 185,
        SBB = 186,
        SCAS = 187,
        SETB = 188,
        SETBE = 189,
        SETL = 190,
        SETLE = 191,
        SETO = 192,
        SETNB = 193,
        SETNBE = 194,
        SETNL = 195,
        SETNLE = 196,
        SETNO = 197,
        SETNP = 198,
        SETNS = 199,
        SETNZ = 200,
        SETP = 201,
        SETS = 202,
        SETZ = 203,
        SGDT = 204,
        SHL = 205,
        SHLD = 206,
        SHR = 207,
        SHRD = 208,
        SIDT = 209,
        SLDT = 210,
        SMSW = 211,
        STC = 212,
        STD = 213,
        STI = 214,
        STOS = 215,
        SUB = 216,
        TEST = 217,
        VERR = 218,
        VERW = 219,
        WAIT = 220,
        XCHG = 221,
        XLAT = 222,
        XOR = 223,
    }

    export enum Size {
        Int8 = 0,
        Int16 = 1,
        Int32 = 2,
        Int64 = 3,
        Int16Int16 = 4,
        Int16Int32 = 5,
        Int32Int32 = 6,
        ByteByte = 7,
        Single = 8,
        Double = 9,
        ExtendedReal = 10,
        PackedBCD = 11,
        PseudoDescriptor6 = 12,
        PseudoDescriptor10 = 13,
        FloatingPointEnvironment14 = 14,
        FloatingPointEnvironment28 = 15,
        FloatingPointState94 = 16,
        FLoatingPointState108 = 17,
    }

    export enum Segment {
        ES = 0,
        CS = 1,
        SS = 2,
        DS = 3,
        FS = 4,
        GS = 5,
        None = 6,
    }

    export enum Register {
        AL = 0,
        AX = 1,
        EAX = 2,
        CL = 3,
        CX = 4,
        ECX = 5,
        DL = 6,
        DX = 7,
        EDX = 8,
        BL = 9,
        BX = 10,
        EBX = 11,
        AH = 12,
        SP = 13,
        ESP = 14,
        CH = 15,
        BP = 16,
        EBP = 17,
        DH = 18,
        SI = 19,
        ESI = 20,
        BH = 21,
        DI = 22,
        EDI = 23,
        CR0 = 24,
        CR1 = 25,
        CR2 = 26,
        CR3 = 27,
        DR0 = 28,
        DR1 = 29,
        DR2 = 30,
        DR3 = 31,
        DR4 = 32,
        DR5 = 33,
        DR6 = 34,
        DR7 = 35,
        Invalid = 36,
    }

    export enum OperandType {
        Register = 0,
        Immediate = 1,
        Segment = 2,
        Indirect = 3,
        Addition = 4,
        Scale = 5,
        Repeat = 6,
        Call = 7,
        FloatingPointStack = 8,
    }

    export enum RepeatType {
        None = 0,
        Equal = 1,
        NotEqual = 2,
    }

    export enum OpcodeInfoFlags {
        None = 0,
        Branch = 1,
        Unconditional = 2,
    }

    export class OpcodeInfo {
        private _name;
        private _flags;

        constructor(name: string, flags?: OpcodeInfoFlags);

        public name: string;
        public flags: OpcodeInfoFlags;
    }

    export var opcodeInfo: OpcodeInfo[];

    export class Operand {
        private _type;

        constructor(type: OperandType);

        public type: OperandType;

        public add(other: Operand): AdditionOperand;

        public scaleBy(scale: number): ScaleOperand;

        public indirect(size: Size, segment: Segment): IndirectOperand;
    }

    export class RegisterOperand extends Operand {
        private static _registerOperands;
        private _reg;

        static getRegister(reg: Register): RegisterOperand;

        constructor(reg: Register);

        public register: Register;
        public size: Size;
    }

    export class SegmentOperand extends Operand {
        private static _segmentOperands;
        private _seg;

        static getSegment(seg: Segment): SegmentOperand;

        constructor(seg: Segment);

        public segment: Segment;
    }

    export class ImmediateOperand extends Operand {
        private _value;
        private _size;

        constructor(value: number, size: Size);

        public value: number;
        public size: Size;
    }

    export class CallOperand extends Operand {
        private _segmentValue;
        private _offsetValue;
        private _size;

        constructor(segmentValue: number, offsetValue: number, size: Size);

        public segmentValue: number;
        public offsetValue: number;
        public size: Size;
    }

    export class AdditionOperand extends Operand {
        private _left;
        private _right;

        constructor(left: Operand, right: Operand);

        public left: Operand;
        public right: Operand;
    }

    export class IndirectOperand extends Operand {
        private _operand;
        private _size;
        private _segment;

        constructor(operand: Operand, size: Size, segment: Segment);

        public operand: Operand;
        public size: Size;
        public segment: Segment;
    }

    export class RepeatOperand extends Operand {
        private _operand;
        private _negate;

        constructor(operand: Operand, negate: boolean);

        public operand: Operand;
        public negate: boolean;
    }

    export class ScaleOperand extends Operand {
        private _index;
        private _scale;

        constructor(index: Operand, scale: number);

        public index: Operand;
        public scale: number;
    }

    export class FloatingPointStackOperand extends Operand {
        private _index;

        constructor(index: number);

        public index: number;
    }

    export class Instruction {
        private _address;
        private _opCode;
        private _isLocked;
        private _isNear;
        private _repeatType;
        private _isNegatedRepeat;
        private _operand1;
        private _operand2;
        private _operand3;

        constructor(address: number, opCode: OpCode, isLocked: boolean, isNear: boolean, repeatType: RepeatType, operand1?: Operand, operand2?: Operand, operand3?: Operand);

        public address: number;
        public opCode: OpCode;
        public isLocked: boolean;
        public isNear: boolean;
        public repeatType: RepeatType;
        public operand1: Operand;
        public operand2: Operand;
        public operand3: Operand;
    }

    export class Disassembler {
        private _segmentAddressMode;
        private _reader;
        private _operandSize;
        private _addressMode;
        private _addressModeOverridden;
        private _operandSizeOverridden;
        private _segmentOverride;
        private _modrm;
        private _readModrm;
        private _opCode;
        private _isLocked;
        private _repeatType;
        private _isNear;
        private _operandCount;
        private _operand1;
        private _operand2;
        private _operand3;
        private _address;

        constructor(segmentAddressMode: Size);

        private reset(reader);

        private flagSet(value, flag);

        private readImmediate(size, isSigned);

        private ensureModrm();

        private reg(modrm);

        private mod(modrm);

        private rm(modrm);

        private decodeOperandSize(index);

        private decodeRegister(index, operandSize);

        private register(reg);

        private displacement(displacementSize);

        private immediate(immediateSize);

        private literal(value);

        private sib();

        private nextOperand(operand);

        private segmentOperand(seg);

        private regOperand(operandSize, flags?);

        private modrmOperand(operandSize, flags?);

        private esdiOperand(operandSize);

        private dssiOperand(operandSize);

        private registerOperand(reg);

        private encodedRegisterOperand(index, operandSize);

        private literalOperand(value);

        private immediateOperand(operandSize);

        private ripOperand(operandSize);

        private displacementOperand(operandSize);

        private offsetOperand(operandSize);

        private callOperand(flags?);

        private floatingPointOperand(index);

        private arithmeticOperands(index);

        private segmentOverride(segment);

        private addressModeOverride();

        private operandSizeOverride();

        private repeatType(repeatType);

        private locked();

        private near();

        private group1OpCode();

        private group2OpCode();

        private group4OpCode();

        private group6OpCode();

        private group8OpCode();

        private jumpOpCode(index);

        private setOpCode(index);

        private opCode(opCode);

        private done();

        private group3(first);

        private group5();

        private group7();

        private escape(opcode);

        private secondByte();

        private firstByte();

        public disassemble(reader: IByteReader): Instruction;
    }
}