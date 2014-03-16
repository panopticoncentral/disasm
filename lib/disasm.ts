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

function aad(reader: IByteReader): Instruction
{
    return null;
}

function aam(reader: IByteReader): Instruction
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

function arpl(reader: IByteReader): Instruction
{
    return null;
}

function bound(reader: IByteReader): Instruction
{
    return null;
}

function call(reader: IByteReader): Instruction
{
    return null;
}

function cbw(reader: IByteReader): Instruction
{
    return null;
}

function cwd(reader: IByteReader): Instruction
{
    return null;
}

function cmp(reader: IByteReader): Instruction
{
    return null;
}

function cmpsb(reader: IByteReader): Instruction
{
    return null;
}

function cmpsw(reader: IByteReader): Instruction
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

function enter(reader: IByteReader): Instruction
{
    return null;
}

function imul(reader: IByteReader): Instruction
{
    return null;
}

function inc(reader: IByteReader): Instruction
{
    return null;
}

function insb(reader: IByteReader): Instruction
{
    return null;
}

function insw(reader: IByteReader): Instruction
{
    return null;
}

function int(reader: IByteReader): Instruction
{
    return null;
}

function into(reader: IByteReader): Instruction
{
    return null;
}

function iret(reader: IByteReader): Instruction
{
    return null;
}

function leave(reader: IByteReader): Instruction
{
    return null;
}

function jmp(reader: IByteReader): Instruction
{
    return null;
}

function lahf(reader: IByteReader): Instruction
{
    return null;
}

function lea(reader: IByteReader): Instruction
{
    return null;
}

function les(reader: IByteReader): Instruction
{
    return null;
}

function lds(reader: IByteReader): Instruction
{
    return null;
}

function lodsb(reader: IByteReader): Instruction
{
    return null;
}

function lodsw(reader: IByteReader): Instruction
{
    return null;
}

function mov(reader: IByteReader): Instruction
{
    return null;
}

function movsb(reader: IByteReader): Instruction
{
    return null;
}

function movsw(reader: IByteReader): Instruction
{
    return null;
}

function nop(reader: IByteReader): Instruction
{
    return null;
}

function or(reader: IByteReader): Instruction
{
    return null;
}

function outsb(reader: IByteReader): Instruction
{
    return null;
}

function outsw(reader: IByteReader): Instruction
{
    return null;
}

function pop(reader: IByteReader): Instruction
{
    return null;
}

function popa(reader: IByteReader): Instruction
{
    return null;
}

function popf(reader: IByteReader): Instruction
{
    return null;
}

function push(reader: IByteReader): Instruction
{
    return null;
}

function pusha(reader: IByteReader): Instruction
{
    return null;
}

function pushf(reader: IByteReader): Instruction
{
    return null;
}

function ret(reader: IByteReader): Instruction
{
    return null;
}

function sahf(reader: IByteReader): Instruction
{
    return null;
}

function sbb(reader: IByteReader): Instruction
{
    return null;
}

function scasb(reader: IByteReader): Instruction
{
    return null;
}

function scasw(reader: IByteReader): Instruction
{
    return null;
}

function stosb(reader: IByteReader): Instruction
{
    return null;
}

function stosw(reader: IByteReader): Instruction
{
    return null;
}

function sub(reader: IByteReader): Instruction
{
    return null;
}

function test(reader: IByteReader): Instruction
{
    return null;
}

function wait(reader: IByteReader): Instruction
{
    return null;
}

function xchg(reader: IByteReader): Instruction
{
    return null;
}

function xlat(reader: IByteReader): Instruction
{
    return null;
}

function xor(reader: IByteReader): Instruction
{
    return null;
}

function ADRSZ(reader: IByteReader): Instruction
{
    return null;
}

function CPESC(reader: IByteReader): Instruction
{
    return null;
}

function ESC(reader: IByteReader): Instruction
{
    return null;
}

function OPRSZ(reader: IByteReader): Instruction
{
    return null;
}

function SEG(reader: IByteReader): Instruction
{
    return null;
}

function Grp1(reader: IByteReader): Instruction
{
    return null;
}

function Grp2(reader: IByteReader): Instruction
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
/* 6 */   pusha,  popa, bound,  arpl,   SEG,   SEG, OPRSZ, ADRSZ,  push,  imul,  push,  imul,  insb,  insw, outsb, outsw,
/* 7 */     jmp,   jmp,   jmp,   jmp,   jmp,   jmp,   jmp,   jmp,   jmp,   jmp,   jmp,   jmp,   jmp,   jmp,   jmp,   jmp,
/* 8 */    Grp1,  Grp1,  Grp1,  Grp1,  test,  test,  xchg,  xchg,   mov,   mov,   mov,   mov,   mov,   lea,   mov,   pop,
/* 9 */     nop,  xchg,  xchg,  xchg,  xchg,  xchg,  xchg,  xchg,   cbw,   cwd,  call,  wait, pushf,  popf,  sahf,  lahf,
/* A */     mov,   mov,   mov,   mov, movsb, movsw, cmpsb, cmpsw,  test,  test, stosb, stosw, lodsb, lodsw, scasb, scasw,
/* B */     mov,   mov,   mov,   mov,   mov,   mov,   mov,   mov,   mov,   mov,   mov,   mov,   mov,   mov,   mov,   mov,
/* C */    Grp2,  Grp2,   ret,   ret,   les,   lds,   mov,   mov, enter, leave,   ret,   ret,   int,   int,  into,  iret,
/* D */    Grp2,  Grp2,  Grp2,  Grp2,   aam,   aad,  null,  xlat, CPESC, CPESC, CPESC, CPESC, CPESC, CPESC, CPESC, CPESC,
/* E */
/* F */    ];