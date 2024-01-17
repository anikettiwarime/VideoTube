import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {User} from '../models/user.model.js';
import {uploadFileOnCloudinary} from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import {FOLDER} from '../constants.js';

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});

        return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(
            500,
            `Something went wrong while generation access and refresh token's`
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validate data - not empty
    // check if user exist in db - username and email
    // check for images - avatar
    // uplaod image to cloudinary - check uploaded or not
    // extract url from the cloudinary upload response
    // create user object in db - instance creation
    // remove password and refresh token field from the user object
    // send response to frontend

    const {fullname, email, username, password} = req.body;

    if (
        [fullname, email, username, password].some(
            (field) => field?.trim === ''
        )
    ) {
        throw new ApiError(400, 'All fields are required');
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}],
    });

    // console.log(existedUser);

    if (existedUser) {
        throw new ApiError(
            409,
            'User with this username or email already exists'
        );
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar is required');
    }

    // upload avatar to cloudinary
    const avatar = await uploadFileOnCloudinary(avatarLocalPath, FOLDER.USERS);
    const coverImage = await uploadFileOnCloudinary(
        coverImageLocalPath,
        FOLDER.USERS
    );

    if (!avatar) {
        throw new ApiError(400, 'Error while uploading avatar');
    }

    const user = await User.create({
        fullname,
        email,
        username,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || '',
    });

    const createdUser = await User.findById(user._id).select(
        '-password -refreshToken'
    );

    if (!createdUser) {
        throw new ApiError(
            500,
            'Something went wrong while registering the user'
        );
    }

    return res
        .status(201)
        .json(new ApiResponse(201, createdUser, 'User created successfully'));
});

const loginUser = asyncHandler(async (req, res) => {
    // Take valid email/username and password
    // valid user in database and check password
    // Generate refresh token
    // store in db and return to user
    // also handle error in each step

    const {email, username, password} = req.body;

    if (!(username || email)) {
        throw new ApiError(400, 'Username or email is required');
    }

    const user = await User.findOne({
        $or: [{username}, {email}],
    });

    if (!user) {
        throw new ApiError(
            404,
            "User doesn't exists with given username or email"
        );
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid user credentials!');
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        '-password -refreshToken'
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: accessToken,
                    refreshToken,
                    loggedInUser,
                },
                'User loggedIn successfully'
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken: undefined,
        },
        new: true,
    });

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(200, {}, 'User loggedout succesfully'));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, 'Unauthorized request');
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, 'Invalid refresh token');
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, 'Refresh token is expired or Used');
        }

        const options = {
            httpOnly: true,
            secure: true,
        };

        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(
            user._id
        );

        return res
            .status(200)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken,
                    },
                    'Token refreshed successfully'
                )
            );
    } catch (error) {
        throw new ApiError(400, error?.message || 'Invalid refresh token');
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {currentPassword, newPassword} = req.body;

    if (!currentPassword || !newPassword) {
        throw new ApiError(
            400,
            'Current password and new password is required'
        );
    }

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const isPasswordValid = await user.isPasswordCorrect(currentPassword);

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid current password');
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Password changed successfully'));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, 'User fetched successfully'));
});

const updateUser = asyncHandler(async (req, res) => {
    const {fullname, username, email, bio, website, phoneNumber} = req.body;

    if (!fullname || !email) {
        throw new ApiError(400, 'Fullname and email is required');
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email,
            },
        },
        {new: true}
    ).select('-password');

    return res
        .status(200)
        .json(new ApiResponse(200, user, 'User updated successfully'));
});

const updateUserAvatarImage = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar is required');
    }

    const avatar = await uploadFileOnCloudinary(avatarLocalPath, FOLDER.USERS);

    if (!avatar) {
        throw new ApiError(400, 'Error while uploading avatar');
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url,
            },
        },
        {new: true}
    ).select('-password');

    return res
        .status(200)
        .json(new ApiResponse(200, user, 'Avatar updated successfully'));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, 'Cover image is required');
    }

    const coverImage = await uploadFileOnCloudinary(
        coverImageLocalPath,
        FOLDER.USERS
    );

    if (!coverImage) {
        throw new ApiError(400, 'Error while uploading cover image');
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url,
            },
        },
        {new: true}
    ).select('-password');

    return res
        .status(200)
        .json(new ApiResponse(200, user, 'Cover image updated successfully'));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {username} = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, 'Username is required');
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase(),
            },
        },
        {
            $lookup: {
                from: 'subscriptions',
                localField: '_id',
                foreignField: 'channel',
                as: 'subscribers',
            },
        },
        {
            $lookup: {
                from: 'subscriptions',
                localField: '_id',
                foreignField: 'subscriber',
                as: 'subscribedTo',
            },
        },
        {
            $addFields: {
                subscribersCount: {$size: '$subscribers'},
                channelIsSubscribedToCount: {$size: '$subscribedTo'},
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, '$subscribers.subscriber'],
                        },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                email: 1,
                avatar: 1,
                fullname: 1,
                username: 1,
                coverImage: 1,
                isSubscribed: 1,
                subscribersCount: 1,
                channelIsSubscribedToCount: 1,
            },
        },
    ]);

    if (!channel?.length) {
        throw new ApiError(404, 'Channel does not exists');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], 'Channel fetched successfully'));
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const {_id} = req.user;

    const user = await User.aggregate([
        {
            $match: {
                id: mongoose.Types.ObjectId(_id),
            },
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'watchHistory',
                foreignField: '_id',
                as: 'watchHistory',
                pipeline: [
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'owner',
                            foreignField: '_id',
                            as: 'owner',
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: '$owner',
                            },
                        },
                    },
                ],
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                'Watch history fetched successfully'
            )
        );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUser,
    updateUserAvatarImage,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
};
