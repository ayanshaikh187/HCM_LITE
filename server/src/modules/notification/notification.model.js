
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    type: {
      type: String,
      enum: ["Leave", "Attendance", "Payroll", "System"],
      default: "System",
    },

    relatedResourceType: {
      type: String,
      enum: [
        "Employee",
        "Leave",
        "Attendance",
        "Payroll",
        "Organization",
        null,
      ],
      default: null,
    },

    relatedResourceId: {
      type: String,
      default: null,
      maxlength: 100,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Recipient notification history
notificationSchema.index({
  organizationId: 1,
  recipientUserId: 1,
  createdAt: -1,
});

// Unread notifications
notificationSchema.index({
  organizationId: 1,
  recipientUserId: 1,
  readAt: 1,
});

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;
