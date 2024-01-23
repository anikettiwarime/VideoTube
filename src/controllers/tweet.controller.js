import {Tweet} from '../models/tweet.model.js';
import {ApiError} from '../utils/ApiError.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiResponse} from '../utils/ApiResponse.js';

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body;
    if (!content) {
        throw new ApiError(400, 'Content is required');
    }

    const createdTweet = await Tweet.create({
        owner: req.user._id,
        content,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, createdTweet, 'Tweet added successfully'));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params;
    if (!userId) {
        throw new ApiError(400, 'User ID is required');
    }

    const tweets = await Tweet.find({owner: userId});

    let data = {
        tweets: tweets,
        totalTweets: tweets.length,
    };

    return res
        .status(200)
        .json(new ApiResponse(200, data, 'Tweets retrieved successfully'));
});

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    if (!tweetId) {
        throw new ApiError(400, 'Tweet ID is required');
    }
    const {content} = req.body;
    if (!content) {
        throw new ApiError(400, 'Content is required');
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        {_id: tweetId, owner: req.user._id},
        {content},
        {new: true}
    );

    if (!updatedTweet) {
        throw new ApiError(404, 'Tweet not found');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTweet, 'Tweet updated successfully'));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    if (!tweetId) {
        throw new ApiError(400, 'Tweet ID is required');
    }

    const deletedTweet = await Tweet.findOneAndDelete({
        _id: tweetId,
        owner: req.user._id,
    });

    if (!deletedTweet) {
        throw new ApiError(404, 'Tweet not found');
    }
    return res
        .status(200)
        .json(new ApiResponse(200, deletedTweet, 'Tweet deleted successfully'));
});

export {createTweet, getUserTweets, updateTweet, deleteTweet};
