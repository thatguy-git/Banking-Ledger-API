"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccountNumber = generateAccountNumber;
function generateAccountNumber() {
    // Generates a number between 1000000000 and 9999999999
    const min = 1000000000;
    const max = 9999999999;
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    return num.toString();
}
