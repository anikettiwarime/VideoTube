import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {Subscription} from '../models/subscription.model.js';
import mongoose from 'mongoose';
import {User} from '../models/user.model.js';

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params;

    if (!channelId) {
        throw new ApiError(400, 'Channel id is required');
    }

    if (mongoose.isValidObjectId(channelId) === false) {
        throw new ApiError(400, 'Channel id is not valid');
    }

    const subscribtionOptions = {
        subscriber: req.user._id,
        channel: channelId,
    };

    const channelExists = await User.exists({_id: channelId});

    if (!channelExists) {
        throw new ApiError(404, 'Not a valid channel');
    }

    const isSubscribed = await Subscription.exists(subscribtionOptions);

    if (isSubscribed) {
        const deletedSubscription =
            await Subscription.deleteOne(subscribtionOptions);

        if (!deletedSubscription) {
            throw new ApiError(500, 'Error while unsubscribing');
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    deletedSubscription,
                    'Unsubscribed successfully'
                )
            );
    } else {
        const newSubscription = await Subscription.create(subscribtionOptions);

        if (!newSubscription) {
            throw new ApiError(500, 'Error while subscribing');
        }

        return res
            .status(201)
            .json(
                new ApiResponse(201, newSubscription, 'Subscribed successfully')
            );
    }
});

const getChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params;

    if (!channelId) {
        throw new ApiError(400, 'Channel id is required');
    }

    if (mongoose.isValidObjectId(channelId) === false) {
        throw new ApiError(400, 'Channel id is not valid');
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'subscriber',
                foreignField: '_id',
                as: 'subscriber',
            },
        },
        {
            $unwind: '$subscriber',
        },
        {
            $project: {
                _id: 0,
                subscriber: {
                    _id: 1,
                    avatar: 1,
                    username: 1,
                    coverImage: 1,
                    subscriberName: '$subscriber.fullname',
                },
            },
        },
    ]);

    if (subscribers?.length === 0) {
        return res
            .status(200)
            .json(new ApiResponse(200, [], 'No subscribers found'));
    }

    const data = {
        subscribers,
        totalSubscribers: subscribers.length,
    };

    return res
        .status(200)
        .json(new ApiResponse(200, data, 'Subscribers fetched successfully'));
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const {subscriberId} = req.params;

    if (!subscriberId) {
        throw new ApiError(400, 'Subscriber id is required');
    }

    if (mongoose.isValidObjectId(subscriberId) === false) {
        throw new ApiError(400, 'Subscriber id is not valid');
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'channel',
                foreignField: '_id',
                as: 'channel',
            },
        },
        {
            $unwind: '$channel',
        },
        {
            $project: {
                _id: 0,
                channel: {
                    _id: 1,
                    avatar: 1,
                    username: 1,
                    coverImage: 1,
                    channelName: '$channel.fullname',
                },
            },
        },
    ]);

    if (subscribedChannels.length === 0) {
        return res
            .status(200)
            .json(
                new ApiResponse(200, [], 'No subscribed channels of given user')
            );
    }

    const data = {
        subscribedChannels,
        totalSubscribedChannels: subscribedChannels.length,
    };

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                data,
                'Subscribed channels fetched successfully'
            )
        );
});

export {toggleSubscription, getChannelSubscribers, getSubscribedChannels};
