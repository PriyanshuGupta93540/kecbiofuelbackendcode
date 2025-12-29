import express from 'express';
import {
  createComment,
  getCommentsByBlogId,
  updateComment,
  deleteComment,
  toggleLike,
  toggleBlogLike,
  getBlogWithLikeStatus
} from '../controllers/commentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createComment);

router.get('/blog/:blogId', getCommentsByBlogId);

router.put('/:id', protect, updateComment);

router.delete('/:id', protect, deleteComment);

router.put('/:id/like', toggleLike);

router.post('/blogs/:id/like', toggleBlogLike);
router.get('/blogs/:id', getBlogWithLikeStatus);


export default router;