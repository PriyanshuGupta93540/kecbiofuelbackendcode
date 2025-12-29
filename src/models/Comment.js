// models/Comment.js
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    blogId: {
      type: String,
      required: [true, 'Blog ID is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    likedByIPs: {
      type: [String],           // array of IP addresses that already liked
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ blogId: 1, createdAt: -1 });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;