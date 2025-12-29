import mongoose from 'mongoose';
import Comment from '../models/Comment.js';

export const createComment = async (req, res) => {
  try {
    const { blogId, content } = req.body;

    if (!blogId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Blog ID and content are required',
      });
    }

    const comment = await Comment.create({
      blogId,
      user: req.user.id,
      content,
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      'user',
      'name email'
    );

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      comment: populatedComment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCommentsByBlogId = async (req, res) => {
  try {
    const { blogId } = req.params;

    const comments = await Comment.find({ 
      blogId, 
      isApproved: true 
    })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment',
      });
    }

    comment.content = content;
    await comment.save();

    const updatedComment = await Comment.findById(id).populate('user', 'name email');

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      comment: updatedComment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment',
      });
    }

    await Comment.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const toggleLike = async (req, res) => {
  try {
    let { id } = req.params;

    /* -----------------------------------
       🔧 NORMALIZE COMMENT ID
    ----------------------------------- */

    // Handle ObjectId wrapped as object
    if (typeof id === 'object' && id?.$oid) {
      id = id.$oid;
    }

    // Ensure id is string
    if (typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Comment ID must be a string',
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID format',
      });
    }

    /* -----------------------------------
       CLIENT IP (LIKE LIMIT)
    ----------------------------------- */

    const forwarded = req.headers['x-forwarded-for'];
    const clientIP =
      forwarded?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      'unknown';

    /* -----------------------------------
       FIND COMMENT
    ----------------------------------- */

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    /* -----------------------------------
       TOGGLE LIKE
    ----------------------------------- */

    const alreadyLiked = comment.likedByIPs.includes(clientIP);

    if (alreadyLiked) {
      comment.likes = Math.max(0, comment.likes - 1);
      comment.likedByIPs = comment.likedByIPs.filter(ip => ip !== clientIP);
    } else {
      comment.likes += 1;
      comment.likedByIPs.push(clientIP);
    }

    await comment.save();

    /* -----------------------------------
       RESPONSE
    ----------------------------------- */

    return res.status(200).json({
      success: true,
      commentId: comment._id.toString(), // 🔥 ALWAYS STRING
      likes: comment.likes,
      hasLiked: !alreadyLiked,
    });

  } catch (error) {
    console.error('Like toggle error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while toggling like',
    });
  }
};



export const toggleBlogLike = async (req, res) => {
  try {
    let { id } = req.params;

    /* -----------------------------------
       🔧 NORMALIZE BLOG ID
    ----------------------------------- */

    // Handle ObjectId wrapped as object
    if (typeof id === 'object' && id?.$oid) {
      id = id.$oid;
    }

    // Ensure id is string
    if (typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Blog ID must be a string',
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog ID format',
      });
    }

    /* -----------------------------------
       CLIENT IP (LIKE LIMIT)
    ----------------------------------- */

    const forwarded = req.headers['x-forwarded-for'];
    const clientIP =
      forwarded?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      'unknown';

    /* -----------------------------------
       FIND BLOG
    ----------------------------------- */

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found',
      });
    }

    /* -----------------------------------
       TOGGLE LIKE
    ----------------------------------- */

    const alreadyLiked = blog.likedByIPs?.includes(clientIP);

    if (alreadyLiked) {
      blog.likes = Math.max(0, blog.likes - 1);
      blog.likedByIPs = blog.likedByIPs.filter(ip => ip !== clientIP);
    } else {
      blog.likes = (blog.likes || 0) + 1;
      if (!blog.likedByIPs) {
        blog.likedByIPs = [];
      }
      blog.likedByIPs.push(clientIP);
    }

    await blog.save();

    /* -----------------------------------
       RESPONSE
    ----------------------------------- */

    return res.status(200).json({
      success: true,
      blogId: blog._id.toString(),
      likes: blog.likes,
      hasLiked: !alreadyLiked,
    });

  } catch (error) {
    console.error('Blog like toggle error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while toggling like',
    });
  }
};

// Optional: Get blog with like status
export const getBlogWithLikeStatus = async (req, res) => {
  try {
    let { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog ID format',
      });
    }

    const forwarded = req.headers['x-forwarded-for'];
    const clientIP =
      forwarded?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      'unknown';

    const blog = await Blog.findById(id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found',
      });
    }

    const hasLiked = blog.likedByIPs?.includes(clientIP) || false;

    return res.status(200).json({
      success: true,
      blog: {
        ...blog.toObject(),
        hasLiked,
      },
    });

  } catch (error) {
    console.error('Error fetching blog:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching blog',
    });
  }
};