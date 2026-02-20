
import pdfParse from 'pdf-parse';
console.log('Type of pdfParse:', typeof pdfParse);
import * as pdf from 'pdf-parse';
console.log('Type of * as pdf:', typeof pdf);
try {
    const p = require('pdf-parse');
    console.log('Type of require:', typeof p);
} catch (e) {
    console.log('require failed');
}
