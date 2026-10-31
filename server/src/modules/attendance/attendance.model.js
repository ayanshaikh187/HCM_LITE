
import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true,
            index: true,
        },

        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },

        date: {
            type: String,
            required: true,
            match: /^\d{4}-\d{2}-\d{2}$/,
        },

        checkIn: {
            type: Date,
            default: null,
        },

        checkOut: {
            type: Date,
            default: null,
        },

        status: {
            type: String,
            enum: ["Present", "Late", "HalfDay", "Absent"],
            default: "Present",
        },

        isLate: {
            type: Boolean,
            default: false,
        },


        workedMinutes: {
            type: Number,
            default: 0,
            min: 0,
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },
    },
    { timestamps: true }
);

// Ek employee ka ek din mein sirf ek attendance record.
attendanceSchema.index(
    { organizationId: 1, employeeId: 1, date: 1 },
    { unique: true }
);

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
