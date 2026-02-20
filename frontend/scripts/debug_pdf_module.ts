
const fs = require('fs');
const path = require('path');

console.log('--- DEBUG PDF-PARSE ---');

try {
    const pdfParse = require('pdf-parse');
    console.log('Type of require("pdf-parse"):', typeof pdfParse);
    console.log('Keys of require("pdf-parse"):', Object.keys(pdfParse));
    console.log('Is Default a function?', typeof pdfParse.default === 'function');

    // Check if it's the module itself
    if (typeof pdfParse === 'function') console.log('It IS a function.');

} catch (e) {
    console.error('Error requiring pdf-parse:', e);
}

try {
    const pdfParseLib = require('pdf-parse/lib/pdf-parse.js');
    console.log('Type of require("pdf-parse/lib/pdf-parse.js"):', typeof pdfParseLib);
    if (typeof pdfParseLib === 'function') console.log('Lib IS a function.');
} catch (e) {
    console.error('Error requiring lib:', e);
}

console.log('--- END DEBUG ---');
