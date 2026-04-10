import mongoose from "mongoose";

/** One row per PDF download — used for admin monthly download stats. */
const PdfDownloadLogSchema = new mongoose.Schema(
  {
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model("PdfDownloadLog", PdfDownloadLogSchema);
