"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMajorUnit = exports.toMinorUnit = void 0;
const toMinorUnit = (amount) => {
    //db format
    const num = Number(amount);
    if (isNaN(num))
        throw new Error('Invalid money amount');
    return BigInt(Math.round(num * 100));
};
exports.toMinorUnit = toMinorUnit;
const toMajorUnit = (amount) => {
    //user format
    return Number(amount) / 100;
};
exports.toMajorUnit = toMajorUnit;
