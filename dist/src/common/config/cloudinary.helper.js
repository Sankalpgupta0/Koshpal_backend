"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = deleteFromCloudinary;
const cloudinary_1 = require("cloudinary");
async function deleteFromCloudinary(publicId) {
    if (!publicId)
        return;
    await cloudinary_1.v2.uploader.destroy(publicId);
}
//# sourceMappingURL=cloudinary.helper.js.map