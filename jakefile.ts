/// <reference path="node_modules/jake-typescript/lib/jake-typescript.d.ts"/>

import ts = require("jake-typescript");

directory("lib");

ts.singleFile("lib/disasm.js", ["lib/disasm.ts"],
{
    noImplicitAny: true,
    moduleKind: ts.ModuleKind.commonjs,
    targetVersion: ts.ESVersion.ES5
});

task("default", ["lib/disasm.js"]);

npmPublishTask('exe', function ()
{
    this.packageFiles.include([
        'jakefile.js',
        'jakefile.ts',
        'LICENSE',
        'makejakefile.cmd',
        'package.json',
        'README.md',
        'lib/disasm.js',
        'lib/disasm.ts',
        'typings/**'
    ]);
    this.needTarGz = true;
    this.needTarBz2 = true;
});
