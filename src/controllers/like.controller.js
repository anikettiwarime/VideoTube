import mongoose, {isValidObjectId} from 'mongoose';
import {Like} from '../models/like.model.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params;

    if (!videoId) {
        throw new ApiError(400, 'Video id is required');
    }

    if (mongoose.isValidObjectId(videoId) === false) {
        throw new ApiError(400, 'Video id is not valid');
    }

    const likedVideoOptions = {
        video: new mongoose.Types.ObjectId(videoId),
        likedBy: new mongoose.Types.ObjectId(req.user._id),
    };

    const likedVideo = await Like.exists(likedVideoOptions);

    if (likedVideo) {
        const deletedLike = await Like.findOneAndDelete(likedVideoOptions);
        if (!deletedLike) {
            throw new ApiError(
                500,
                'Something went wrong while removing video like'
            );
        }
        return res
            .status(200)
            .json(new ApiResponse(200, null, 'Video unliked successfully'));
    }

    const newLikedVideo = await Like.create(likedVideoOptions);
    if (!newLikedVideo) {
        throw new ApiError(500, 'Something went wrong while adding video like');
    }

    return res
        .status(201)
        .json(new ApiResponse(201, newLikedVideo, 'Video liked successfully'));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params;

    if (!commentId) {
        throw new ApiError(400, 'Comment id is required');
    }

    if (mongoose.isValidObjectId(commentId) === false) {
        throw new ApiError(400, 'Comment id is not valid');
    }

    const likedCommentOptions = {
        comment: new mongoose.Types.ObjectId(commentId),
        likedBy: new mongoose.Types.ObjectId(req.user._id),
    };

    const likedComment = await Like.exists(likedCommentOptions);

    if (likedComment) {
        const deletedLike = await Like.findOneAndDelete(likedCommentOptions);
        if (!deletedLike) {
            throw new ApiError(
                500,
                'Something went wrong while removing comment like'
            );
        }
        return res
            .status(200)
            .json(new ApiResponse(200, null, 'Comment unliked successfully'));
    }

    const newLikedComment = await Like.create(likedCommentOptions);

    if (!newLikedComment) {
        throw new ApiError(
            500,
            'Something went wrong while adding comment like'
        );
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, newLikedComment, 'Comment liked successfully')
        );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;

    if (!tweetId) {
        throw new ApiError(400, 'Tweet id is required');
    }

    if (mongoose.isValidObjectId(tweetId) === false) {
        throw new ApiError(400, 'Tweet id is not valid');
    }

    const likedTweetOptions = {
        tweet: new mongoose.Types.ObjectId(tweetId),
        likedBy: new mongoose.Types.ObjectId(req.user._id),
    };

    const likedTweet = await Like.exists(likedTweetOptions);

    if (likedTweet) {
        const deletedLike = await Like.findOneAndDelete(likedTweetOptions);
        if (!deletedLike) {
            throw new ApiError(
                500,
                'Something went wrong while removing tweet like'
            );
        }
        return res
            .status(200)
            .json(new ApiResponse(200, null, 'Tweet unliked successfully'));
    }

    const newLikedTweet = await Like.create(likedTweetOptions);

    if (!newLikedTweet) {
        throw new ApiError(500, 'Something went wrong while adding tweet like');
    }

    return res
        .status(201)
        .json(new ApiResponse(201, newLikedTweet, 'Tweet liked successfully'));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.find({
        likedBy: new mongoose.Types.ObjectId(req.user._id),
        video: {$ne: null},
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedVideos,
                'Liked videos fetched successfully'
            )
        );
});

export {toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos};
