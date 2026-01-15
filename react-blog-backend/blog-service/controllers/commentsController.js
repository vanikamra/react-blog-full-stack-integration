// TODO
// 1. Import Models
      // Objective: Use Mongoose models for comments and posts.
      // Steps:
          // Ensure Comment and Post models are imported.

// 2. Fetch All Comments for a Post
      // Objective: Retrieve all comments associated with a specific post ID.
      // Steps:
          // Use Comment.find() to fetch comments where post matches req.params.id.
          // Use populate() to include details about the author (e.g., name and email).
          // Handle errors by wrapping the logic in a try...catch block.
          // Return the fetched comments as a JSON response.

// 3. Fetch a Single Comment by ID
      // Objective: Retrieve a specific comment using its ID.
      // Steps:
          // Use Comment.findById() to fetch the comment by req.params.id.
          // Use populate() to include author details.
          // Check if the comment exists; if not, return a 404 Not Found response.
          // Handle errors and return a JSON response with the comment or error message.

// 4. Add a New Comment
      // Objective: Add a comment to a specific post.
      // Steps:
          // Extract content from req.body.
          // Use Post.findById() to verify the existence of the post associated with req.params.id.
          // Create a new comment with the content, author (from req.user.id), and post ID.
          // Save the comment using comment.save().
          // Update the post's comments array by pushing the new comment's ID and saving the post.
          // Handle errors and return a success response with the created comment.

// 5. Edit a Comment
      // Objective: Allow the author to edit their comment.
      // Steps:
          // Use Comment.findById() to fetch the comment by req.params.id.
          // Verify the comment exists; if not, return a 404 Not Found response.
          // Check if the logged-in user (req.user.id) matches the comment's author.
          // Update the comment's content with the new value from req.body.content.
          // Save the updated comment using comment.save().
          // Handle errors and return a success response with the updated comment.

// 6. Delete a Comment
      // Objective: Allow the author to delete their comment.
      // Steps:
          // Use Comment.findById() to fetch the comment by req.params.id.
          // Verify the comment exists; if not, return a 404 Not Found response.
          // Check if the logged-in user (req.user.id) matches the comment's author.
          // Use comment.deleteOne() to delete the comment from the database.
          // Update the associated post by removing the comment ID from its comments array using Post.updateOne() with $pull.
          // Handle errors and return a success response.

// 7. Integrate with Routes
      // Objective: Connect these controller functions to the Express routes.
      // Steps:
          // Import these functions into the comments router file.
          // Define the routes and attach the corresponding controller functions:
          // GET /comments/:id → getComments
          // POST /comments/:id → addComment
          // PUT /comments/:id → editComment
          // DELETE /comments/:id → deleteComment


          // blog-service/controllers/commentsController.js

// 1. Import Models
const Comment = require("../models/Comments");
const Post = require("../models/Posts");

// 2. Fetch All Comments for a Post
const getComments = async (req, res) => {
  try {
    const postId = req.params.id;

    const comments = await Comment.find({ post: postId })
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    return res.json(comments);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch comments",
      error: error.message,
    });
  }
};

// 3. Fetch a Single Comment by ID 
const getCommentById = async (req, res) => {
  try {
    const commentId = req.params.id;

    const comment = await Comment.findById(commentId).populate(
      "author",
      "name email"
    );

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    return res.json(comment);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch comment",
      error: error.message,
    });
  }
};

// 4. Add a New Comment
const addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = new Comment({
      content: content.trim(),
      author: req.user.id, // comes from protect middleware
      post: postId,
    });

    const savedComment = await comment.save();

    // Push comment ID into Post.comments array
    post.comments.push(savedComment._id);
    await post.save();

    // Return populated comment for nicer UI
    const populated = await Comment.findById(savedComment._id).populate(
      "author",
      "name email"
    );

    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to add comment",
      error: error.message,
    });
  }
};

// 5. Edit a Comment
const editComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Author-only
    if (String(comment.author) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not authorized to edit this comment" });
    }

    comment.content = content.trim();
    await comment.save();

    const populated = await Comment.findById(comment._id).populate(
      "author",
      "name email"
    );

    return res.json(populated);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to edit comment",
      error: error.message,
    });
  }
};

// 6. Delete a Comment
const deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (String(comment.author) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    await comment.deleteOne();

    await Post.updateOne(
      { _id: comment.post },
      { $pull: { comments: commentId } }
    );

    return res.json({ message: "Comment deleted" });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete comment",
      error: error.message,
    });
  }
};

module.exports = {
  getComments,
  getCommentById,
  addComment,
  editComment,
  deleteComment,
};
