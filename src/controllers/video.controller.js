import {asyncHandler} from '../utils/asyncHandler.js';
import {Video} from '../models/video.model.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {uploadFileOnCloudinary} from '../utils/cloudinary.js';
import {FOLDER} from '../constants.js';
import {ApiError} from '../utils/ApiError.js';
import {getVideoDurationInSeconds} from 'get-video-duration';

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

export {publishVideo};
