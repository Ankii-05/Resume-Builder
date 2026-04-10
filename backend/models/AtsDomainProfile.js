import mongoose from "mongoose";

function slugify(input) {
  const s = String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return s.slice(0, 80) || "domain";
}

const AtsDomainProfileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    keywords: [{ type: String, trim: true }],
    suggestedKeywords: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

AtsDomainProfileSchema.pre("validate", async function preSlug(next) {
  try {
    if (!this.slug && this.name) {
      this.slug = slugify(this.name);
    } else if (this.isModified("slug") || this.isModified("name")) {
      this.slug = slugify(this.slug || this.name);
    }
    if (!this.slug) {
      this.slug = "domain";
    }
    const base = this.slug;
    let candidate = base;
    let n = 0;
    const Model = this.constructor;
    while (true) {
      const q = { slug: candidate };
      if (this._id) q._id = { $ne: this._id };
      const exists = await Model.findOne(q).select("_id").lean();
      if (!exists) {
        this.slug = candidate;
        break;
      }
      n += 1;
      candidate = `${base}_${n}`;
    }
    next();
  } catch (e) {
    next(e);
  }
});

export default mongoose.model("AtsDomainProfile", AtsDomainProfileSchema);
export { slugify };
