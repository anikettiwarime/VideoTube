import mongoose from 'mongoose';
import {Comment} from '../models/comment.model.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params;
    const {page = 1, limit = 10} = req.query;

    const comments = await Comment.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user._id),
                video: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            avatar: 1,
                            coverImage: 1,
                        },
                    },
                ],
                as: 'owner',
            },
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'video',
                foreignField: '_id',
                pipeline: [
                    {
                        $project: {
                            description: 1,
                            title: 1,
                            duration: 1,
                            viewCount: 1,
                        },
                    },
                ],
                as: 'video',
            },
        },
        {
            $addFields: {
                owner: {
                    $first: '$owner',
                },
                video: {
                    $first: '$video',
                },
            },
        },
        {
            $project: {
                owner: 1,
                video: 1,
                content: 1,
                createdAt: 1,
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $skip: (page - 1) * parseInt(limit),
        },
        {
            $limit: parseInt(limit),
        },
    ]);

    if (!comments) {
        throw new ApiError('Comments not found', 404);
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, comments, 'Comments retrieved successfully')
        );
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params;
    const {content} = req.body;
    const comment = await Comment.create({
        content,
        owner: new mongoose.Types.ObjectId(req.user._id),
        video: new mongoose.Types.ObjectId(videoId),
    });

    if (!comment) {
        throw new ApiError('Comment not created', 400);
    }

    console.log(comment);

    return res
        .status(201)
        .json(new ApiResponse(201, comment, 'Comment created successfully'));
});

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const {content} = req.body;
    const comment = await Comment.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(commentId),
            owner: new mongoose.Types.ObjectId(req.user._id),
        },
        {content},
        {new: true}
    );

    if (!comment) {
        throw new ApiError('Comment not found', 404);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comment, 'Comment updated successfully'));
});

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const comment = await Comment.findByIdAndDelete({
        _id: new mongoose.Types.ObjectId(commentId),
        owner: new mongoose.Types.ObjectId(req.user._id),
    });

    if (!comment) {
        throw new ApiError('Comment not found', 404);
    }

    return res
        .status(204)
        .json(new ApiResponse(204, null, 'Comment deleted successfully'));
});

export {getVideoComments, addComment, updateComment, deleteComment};
