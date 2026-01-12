"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSlotDateInIST = getSlotDateInIST;
exports.getSlotTimeInIST = getSlotTimeInIST;
exports.formatSlotTimeInIST = formatSlotTimeInIST;
exports.formatSlotDateTimeInIST = formatSlotDateTimeInIST;
exports.isSameDateIST = isSameDateIST;
exports.parseISTDateString = parseISTDateString;
exports.getTodayDateInIST = getTodayDateInIST;
exports.isSlotOnSelectedDate = isSlotOnSelectedDate;
const IST_TIMEZONE = 'Asia/Kolkata';
function getSlotDateInIST(utcDate) {
    const istDate = new Date(utcDate.toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const day = String(istDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function getSlotTimeInIST(utcDate) {
    const istDate = new Date(utcDate.toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
    const hours = String(istDate.getHours()).padStart(2, '0');
    const minutes = String(istDate.getMinutes()).padStart(2, '0');
    const seconds = String(istDate.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}
function formatSlotTimeInIST(utcDate) {
    const istDate = new Date(utcDate.toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
    return istDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}
function formatSlotDateTimeInIST(utcDate) {
    const istDate = new Date(utcDate.toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
    return istDate.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}
function isSameDateIST(date1, date2) {
    return date1 === date2;
}
function parseISTDateString(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
}
function getTodayDateInIST() {
    return getSlotDateInIST(new Date());
}
function isSlotOnSelectedDate(slotDate, selectedDate) {
    return isSameDateIST(slotDate, selectedDate);
}
//# sourceMappingURL=timezone.util.js.map