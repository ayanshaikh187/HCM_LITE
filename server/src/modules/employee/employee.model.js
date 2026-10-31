
import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    employeeCode: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    department: {
      type: String,
      trim: true,
      required: true,
    },

    designation: {
      type: String,
      trim: true,
      required: true,
    },

    joiningDate: {
      type: Date,
      required: true,
    },

    employmentStatus: {
      type: String,
      enum: ["Active", "OnLeave", "Resigned", "Terminated", "Inactive"],
      default: "Active",
    },

    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

employeeSchema.index(
  { organizationId: 1, employeeCode: 1 },
  { unique: true }
);

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
