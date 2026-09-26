import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },

    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      minlength: 6,
      select: false,
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

    profileImage: {
      type: String,
      default: "",
    },

    googleId: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: ["member", "admin"],
      default: "member",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    /*
     * Transaction PIN
     *
     * The actual PIN is NEVER stored as plain text.
     * Only the bcrypt hash is stored.
     */
    transactionPin: {
      type: String,
      select: false,
      default: "",
    },

    pinSet: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/*
 * Hash login password when it changes.
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(
    this.password,
    salt
  );

  next();
});

/*
 * Compare login password.
 */
userSchema.methods.comparePassword = async function (
  candidatePassword
) {
  if (!this.password) return false;

  return bcrypt.compare(
    candidatePassword,
    this.password
  );
};

/*
 * Compare transaction PIN.
 */
userSchema.methods.compareTransactionPin =
  async function (candidatePin) {
    if (!this.transactionPin) {
      return false;
    }

    return bcrypt.compare(
      candidatePin,
      this.transactionPin
    );
  };

userSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    address: this.address,
    profileImage: this.profileImage,
    role: this.role,
    isActive: this.isActive,
    pinSet: this.pinSet,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model(
  "User",
  userSchema
);