import mongoose from "mongoose";

const AtsLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    fileName: { type: String, default: "" },
    domain: { type: String, required: true },
    customDomain: { type: String, default: "" },
    overallScore: { type: Number, required: true },
    label: { type: String, default: "" },
    breakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    matchedKeywords: [{ type: String }],
    missingKeywords: [{ type: String }],
    suggestions: [{ type: String }],
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

export default mongoose.model("AtsLog", AtsLogSchema);
