"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = exports.sendError = void 0;
const sendError = (res, status, message) => res.status(status).json({ message });
exports.sendError = sendError;
const sendSuccess = (res, data) => res.status(200).json(data);
exports.sendSuccess = sendSuccess;
