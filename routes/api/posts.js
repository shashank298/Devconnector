const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Post = require('../../models/Post');
const User = require('../../models/User');
const Profile = require('../../models/Profile');

// @route   POST api/posts
// @desc    Test route
// @access  Public
router.post(
  '/',
  [auth, [check('text', 'text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });
      const post = await newPost.save();
      res.json(post);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('server error');
    }
  }
);

// @route   GET api/posts
// @desc    GET all posts
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const allPosts = await Post.find().sort({ date: -1 });

    res.json(allPosts);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('server error');
  }
});

// @route   GET api/posts/:id
// @desc    GET post
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'page not found' });
    }
    res.json(post);
  } catch (error) {
    console.error(error.message);
    if (!error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'page not found' });
    }
    res.status(500).send('server error');
  }
});

// @route   DELETE api/posts/:id
// @desc    DELETE post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'page not found' });
    }
    if (post.user.toString() !== req.user.id) {
      return res.status(404).json({ msg: 'user not authoirized' });
    }

    await post.remove();

    res.json({ msg: 'Post deleted' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('server error');
  }
});

// @route   PUT api/posts/like/:id
// @desc    Like the posts
// @access  Private
router.put('/likes/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'post not found' });
    }
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(404).json({ msg: 'You already liked this post' });
    }
    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('server error');
  }
});

// @route   PUT api/posts/unlike/:id
// @desc    Unlike the posts
// @access  Private
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'post not found' });
    }
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(404).json({ msg: 'You did not like this post' });
    }
    const index = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(index, 1);
    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('server error');
  }
});

// @route   POST api/posts/comment/:id
// @desc    ADD comment to the p0st
// @access  Private
router.post(
  '/comment/:id',
  [auth, [check('text', 'text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ msg: 'post not found' });
      }
      const newComment = {
        user: req.user.id,
        name: user.name,
        avatar: user.avatar,
        text: req.body.text,
      };

      post.comments.unshift(newComment);
      await post.save();
      res.json(post.comments);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('server error');
    }
  }
);

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete the comment
// @access  Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'post not found' });
    }
    const userComments = post.comments.map(
      (comment) => comment.user.toString() === req.user.id
    );
    if (!userComments) {
      return res.status(404).json({ msg: 'comments does not exist ' });
    }
    const index = userComments
      .map((comment) => comment.id)
      .indexOf(req.params.comment_id);
    post.comments.splice(index, 1);
    await post.save();
    res.json(post.comments);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('server error');
  }
});

module.exports = router;
