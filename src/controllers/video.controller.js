import {asyncHandler} from '../utils/asyncHandler.js';
import {Video} from '../models/video.model.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {FOLDER} from '../constants.js';
import {ApiError} from '../utils/ApiError.js';
import {getVideoDurationInSeconds} from 'get-video-duration';
import mongoose from 'mongoose';
import {
    uploadFileOnCloudinary,
    deleteFileFromCloudinary,
} from '../utils/cloudinary.js';

const publishVideo = asyncHandler(async (req, res) => {
    const {title, description} = req.body;

    const videoFileLocalPath = req.files?.videoFile[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    if (!videoFileLocalPath) {
        throw new ApiError(400, 'Video file is required');
    }

    const videoDuration = await getVideoDurationInSeconds(videoFileLocalPath);

    if (!thumbnailLocalPath) {
        throw new ApiError(400, 'Thumbnail is required');
    }

    const videoFile = await uploadFileOnCloudinary(
        videoFileLocalPath,
        FOLDER.VIDEOS
    );
    const thumbnail = await uploadFileOnCloudinary(
        thumbnailLocalPath,
        FOLDER.THUMBNAIL
    );

    if (!videoFile) {
        throw new ApiError(500, 'Error while uploading video file');
    }

    if (!thumbnail) {
        throw new ApiError(500, 'Error while uploading thumbnail file');
    }

    const video = await Video.create({
        title,
        description,
        thumbnail: thumbnail.url,
        videoUrl: videoFile.url,
        duration: videoDuration,
        owner: req.user._id,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, video, 'Video published successfully'));
});

const getVideoById = asyncHandler(async (req, res) => {
    const {videoId} = req.params;

    if (!videoId) {
        throw new ApiError(400, 'Video id is required');
    }

    if (mongoose.isValidObjectId(videoId) === false) {
        throw new ApiError(400, 'Video id is not valid');
    }

    // const video = await Video.findById(videoId);

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'channel',
            },
        },
        {
            $unwind: '$channel',
        },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                thumbnail: 1,
                videoUrl: 1,
                duration: 1,
                createdAt: 1,
                isPublished: 1,
                channel: {
                    _id: 1,
                    username: 1,
                    avatar: 1,
                },
            },
        },
    ]);

    if (!video?.length) {
        throw new ApiError(404, 'Video not found');
    }

    return res.status(200).json(new ApiResponse(200, video, 'Video found'));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const {videoId} = req.params;

    if (!videoId) {
        throw new ApiError(400, 'Video id is required');
    }

    if (mongoose.isValidObjectId(videoId) === false) {
        throw new ApiError(400, 'Video id is not valid');
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, 'Video not found');
    }

    video.isPublished = !video.isPublished;
    await video.save();

    let message = '';

    if (video?.isPublished) {
        message = 'Video published successfully';
    } else {
        message = 'Video unpublished successfully';
    }

    return res.status(200).json(new ApiResponse(200, video, message));
});

const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy,
        sortType,
        userId,
        published,
    } = req.query;

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
    };

    const aggregate = Video.aggregate();

    if (query) {
        aggregate.match({
            title: {
                $regex: query,
                $options: 'i',
            },
        });
    }

    if (sortBy && sortType) {
        const sortOrder = sortType === 'desc' ? -1 : 1;
        aggregate.sort({[sortBy]: sortOrder});
    }

    if (userId) {
        aggregate.match({
            owner: new mongoose.Types.ObjectId(userId),
        });
        aggregate
            .lookup({
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'channel',
            })
            .unwind('channel');
    }

    aggregate.lookup({
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'channel',
    });

    if (published) {
        aggregate.match({
            isPublished: true,
        });
    }

    aggregate.project({
        _id: 1,
        title: 1,
        description: 1,
        thumbnail: 1,
        videoUrl: 1,
        duration: 1,
        createdAt: 1,
        isPublished: 1,
        channel: {
            _id: 1,
            username: 1,
            avatar: 1,
            coverImage: 1,
        },
    });

    const video = await Video.aggregatePaginate(aggregate, {
        ...options,
        customLabels: {
            docs: 'videos',
            totalDocs: 'total videos',
        },
    });

    return res.status(200).json(new ApiResponse(200, video, 'Videos found'));
});

const updateVideo = asyncHandler(async (req, res) => {
    const {videoId} = req.params;

    if (!videoId) {
        throw new ApiError(400, 'Video id is required');
    }

    if (mongoose.isValidObjectId(videoId) === false) {
        throw new ApiError(400, 'Video id is not valid');
    }

    const {title, description} = req.body;
    const thumbnailLocalPath = req.file?.path;

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, 'Video not found');
    }

    if (thumbnailLocalPath) {
        await deleteFileFromCloudinary(FOLDER.THUMBNAIL, video.thumbnail);

        const thumbnail = await uploadFileOnCloudinary(
            thumbnailLocalPath,
            FOLDER.THUMBNAIL
        );

        if (!thumbnail) {
            throw new ApiError(500, 'Error while uploading thumbnail file');
        }

        video.thumbnail = thumbnail.url;
    }

    if (title) {
        video.title = title;
    }

    if (description) {
        video.description = description;
    }

    await video.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video,
                `Video updated successfully with id ${videoId}`
            )
        );
});

const deleteVideo = asyncHandler(async (req, res) => {
    const {videoId} = req.params;

    if (!videoId) {
        throw new ApiError(400, 'Video id is required');
    }

    if (mongoose.isValidObjectId(videoId) === false) {
        throw new ApiError(400, 'Video id is not valid');
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, 'Video not found');
    }

    if (req.user._id.toString() !== video.owner.toString()) {
        throw new ApiError(403, 'You are not authorized to delete this video');
    }

    await deleteFileFromCloudinary(FOLDER.THUMBNAIL, video.thumbnail);
    await deleteFileFromCloudinary(FOLDER.VIDEOS, video.videoUrl);

    await Video.deleteOne({_id: videoId});

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                `Video deleted successfully with id ${videoId}`
            )
        );
});

export {
    publishVideo,
    getVideoById,
    togglePublishStatus,
    getAllVideos,
    updateVideo,
    deleteVideo,
};
