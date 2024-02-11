import mongoose from 'mongoose';
import {Video} from '../models/video.model.js';
import {Subscription} from '../models/subscription.model.js';
import {Like} from '../models/like.model.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';

const getChannelStats = asyncHandler(async (req, res) => {
    const videoStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user._id),
            },
        },
        {
            $group: {
                _id: null,
                totalVideoViews: {
                    $sum: '$viewCount',
                },
                totalVideos: {
                    $sum: 1,
                },
                videos: {
                    $push: '$_id',
                },
            },
        },
    ]);

    const totalSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(req.user._id),
            },
        },
        {
            $group: {
                _id: null,
                totalSubscribers: {
                    $sum: 1,
                },
            },
        },
    ]);

    const totalLikes = await Like.aggregate([
        {
            $match: {
                video: {
                    $in: videoStats[0].videos,
                },
            },
        },
        {
            $group: {
                _id: null,
                totalLikes: {
                    $sum: 1,
                },
            },
        },
    ]);

    const stats = {
        totalVideoViews: videoStats[0].totalVideoViews,
        totalVideos: videoStats[0].totalVideos,
        totalSubscribers: totalSubscribers[0].totalSubscribers,
        totalLikes: totalLikes[0].totalLikes,
    };

    res.status(200).json(
        new ApiResponse(200, stats, 'Channel stats fetched successfully')
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const {page = 1, limit = 10} = req.query;

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const videos = await Video.aggregate([
        {
            $match: {
                owner: ObjectId('655f98e475e9ebb4f034c12f'),
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                videoUrl: 1,
                duration: 1,
                viewCount: 1,
                isPublished: 1,
                createdAt: 1,
                updatedAt: 1,
            },
        },
        {
            $facet: {
                videos: [
                    {
                        $skip: (options?.page - 1) * options?.limit,
                    },
                    {
                        $limit: options?.limit,
                    },
                ],
                totalVideos: [
                    {
                        $count: 'totalVideos',
                    },
                ],
            },
        },
        {
            $project: {
                videos: 1,
                totalVideos: {$arrayElemAt: ['$totalVideos.totalVideos', 0]},
            },
        },
    ]);

    const result = {
        videos: videos[0].videos,
        totalVideos: videos[0].totalVideos,
        totalPages: Math.ceil(videos[0].totalVideos / options.limit),
    };

    res.status(200).json(
        new ApiResponse(200, result, 'Channel videos fetched successfully')
    );
});

export {getChannelStats, getChannelVideos};
