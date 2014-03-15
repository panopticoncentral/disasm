export interface IByteReader
{
    current(): number;
    moveNext(): boolean;
}

export class Instruction
{
}

function aaa(reader: IByteReader): Instruction
{
    return null;
}

function aas(reader: IByteReader): Instruction
{
    return null;
}

function adc(reader: IByteReader): Instruction
{
    return null;
}

function add(reader: IByteReader): Instruction
{
    return null;
}

function and(reader: IByteReader): Instruction
{
    return null;
}

function cmp(reader: IByteReader): Instruction
{
    return null;
}

function daa(reader: IByteReader): Instruction
{
    return null;
}

function das(reader: IByteReader): Instruction
{
    return null;
}

function dec(reader: IByteReader): Instruction
{
    return null;
}

function inc(reader: IByteReader): Instruction
{
    return null;
}

function or(reader: IByteReader): Instruction
{
    return null;
}

function pop(reader: IByteReader): Instruction
{
    return null;
}

function push(reader: IByteReader): Instruction
{
    return null;
}

function sbb(reader: IByteReader): Instruction
{
    return null;
}

function sub(reader: IByteReader): Instruction
{
    return null;
}

function xor(reader: IByteReader): Instruction
{
    return null;
}

function ESC(reader: IByteReader): Instruction
{
    return null;
}

function SEG(reader: IByteReader): Instruction
{
    return null;
}


var opcodes: { (reader: IByteReader): Instruction }[] =
        /*    0      1      2      3      4      5      6      7      8      9      A      B      C      D      E      F */
/* 0 */ [   add,   add,   add,   add,   add,   add,  push,   pop,    or,    or,    or,    or,    or,    or,  push,   ESC,
/* 1 */     adc,   adc,   adc,   adc,   adc,   adc,  push,   pop,   sbb,   sbb,   sbb,   sbb,   sbb,   sbb,  push,   pop,
/* 2 */     and,   and,   and,   and,   and,   and,   SEG,   daa,   sub,   sub,   sub,   sub,   sub,   sub,   SEG,   das,
/* 3 */     xor,   xor,   xor,   xor,   xor,   xor,   SEG,   aaa,   cmp,   cmp,   cmp,   cmp,   cmp,   cmp,   SEG,   aas,
/* 4 */     inc,   inc,   inc,   inc,   inc,   inc,   inc,   inc,   dec,   dec,   dec,   dec,   dec,   dec,   dec,   dec,
/* 5 */    push,  push,  push,  push,  push,  push,  push,  push,   pop,   pop,   pop,   pop,   pop,   pop,   pop,   pop,
/* 6 */   ];