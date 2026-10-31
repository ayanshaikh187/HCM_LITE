import mongoose from "mongoose";

const auditSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    actorName: {
      type: String,
      required: true,
      maxlength: 120,
    },

    actorRole: {
      type: String,
      enum: ["Admin", "HR", "Employee", "System"],
      required: true,
    },

    action: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
    },

    resourceType: {
      type: String,
      required: true,
      maxlength: 80,
      trim: true,
    },

    resourceId: {
      type: String,
      default: null,
      maxlength: 100,
    },

    description: {
      type: String,
      required: true,
      maxlength: 500,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    ipAddress: {
      type: String,
      default: null,
      maxlength: 100,
    },

    userAgent: {
      type: String,
      default: null,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

auditSchema.index({
  organizationId: 1,
  createdAt: -1,
});

auditSchema.index({
  organizationId: 1,
  action: 1,
  createdAt: -1,
});

const Audit =
  mongoose.models.Audit ||
  mongoose.model("Audit", auditSchema);

export default Audit;