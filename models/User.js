import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const CUSTOMER_TYPES = [
  "personal",
  "student",
  "business",
];

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
      match: [
        /^\S+@\S+\.\S+$/,
        "Please provide a valid email",
      ],
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

    // =====================================================
    // SYSTEM ROLE
    // =====================================================

    role: {
      type: String,
      enum: ["member", "admin"],
      default: "member",
    },

    // =====================================================
    // CUSTOMER TYPE
    //
    // This is different from Account.accountType.
    //
    // customerType:
    // personal / student / business
    //
    // accountType:
    // savings / current / salary
    // =====================================================

    customerType: {
      type: String,
      enum: CUSTOMER_TYPES,
      default: "personal",
      lowercase: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // =====================================================
    // TRANSACTION PIN
    // =====================================================

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
  {
    timestamps: true,
  }
);

// =====================================================
// HASH LOGIN PASSWORD
// =====================================================

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

// =====================================================
// COMPARE PASSWORD
// =====================================================

userSchema.methods.comparePassword = async function (
  candidatePassword
) {
  if (!this.password) {
    return false;
  }

  return bcrypt.compare(
    candidatePassword,
    this.password
  );
};

// =====================================================
// COMPARE TRANSACTION PIN
// =====================================================

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

// =====================================================
// SAFE USER OBJECT
// =====================================================

userSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,

    name: this.name,

    email: this.email,

    phone: this.phone,

    address: this.address,

    profileImage: this.profileImage,

    role: this.role,

    // Existing users without this field are treated
    // as personal customers.
    customerType:
      this.customerType || "personal",

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