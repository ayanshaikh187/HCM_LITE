
import mongoose from "mongoose";

const leaveTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ["Annual", "Sick", "Casual", "Unpaid"],
    },
    yearlyQuota: {
      type: Number,
      default: null,
      min: 0,
    },
  },
  { _id: false }
);

const organizationSchema = new mongoose.Schema(
  {
    // Unique key ensures only one primary company setup.
    systemKey: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      default: "primary",
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    timezone: {
      type: String,
      default: "Asia/Karachi",
    },

    officeStart: {
      type: String,
      default: "09:00",
    },

    graceMinutes: {
      type: Number,
      default: 15,
      min: 0,
    },

    halfDayUnderHours: {
      type: Number,
      default: 5,
      min: 0,
    },

    weekendDays: {
      type: [Number],
      default: [0, 6],
      validate: {
        validator: (days) =>
          days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6),
        message: "Weekend days must be between 0 and 6",
      },
    },

    officeLocation: {
      latitude: { type: Number, default: null, min: -90, max: 90 },
      longitude: { type: Number, default: null, min: -180, max: 180 },
      radiusMeters: { type: Number, default: 150, min: 1 },
    },

    leaveTypes: {
      type: [leaveTypeSchema],
      default: () => [
        { name: "Annual", yearlyQuota: 14 },
        { name: "Sick", yearlyQuota: 8 },
        { name: "Casual", yearlyQuota: 10 },
        { name: "Unpaid", yearlyQuota: null },
      ],
    },

    holidays: {
      type: [
        {
          date: { type: Date, required: true },
          name: { type: String, required: true, trim: true },
        },
      ],
      default: [],
    },

    setupCompletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Organization = mongoose.model(
  "Organization",
  organizationSchema
);

export default Organization;
