import mongoose, {isValidObjectId} from 'mongoose';
import {Playlist} from '../models/playlist.model.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body;

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id,
    });

    if (!playlist) {
        throw new ApiError(500, 'Failed to create playlist');
    }

    return res
        .status(201)
        .json(new ApiResponse(201, playlist, 'Playlist created successfully'));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params;

    if (!userId) {
        throw new ApiError(400, 'User ID is required');
    }

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, 'Invalid user ID');
    }

    const playlists = await Playlist.find({owner: userId});

    if (!playlists) {
        throw new ApiError(404, 'No playlists found');
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlists, 'Playlists retrieved successfully')
        );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;

    if (!playlistId) {
        throw new ApiError(400, 'Playlist ID is required');
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, 'Invalid playlist ID');
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, 'Playlist not found');
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, 'Playlist retrieved successfully')
        );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params;

    if (!playlistId || !videoId) {
        throw new ApiError(400, 'Playlist ID and video ID are required');
    }

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid playlist ID or video ID');
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, 'Playlist not found');
    }

    const videoExists = playlist.videos.find((v) => v.toString() === videoId);

    if (videoExists) {
        throw new ApiError(400, 'Video already exists in playlist');
    }

    playlist.videos.push(videoId);

    const updatedPlaylist = await playlist.save();

    if (!updatedPlaylist) {
        throw new ApiError(500, 'Failed to add video to playlist');
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                'Video added to playlist successfully'
            )
        );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params;

    if (!playlistId || !videoId) {
        throw new ApiError(400, 'Playlist ID and video ID are required');
    }

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid playlist ID or video ID');
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, 'Playlist not found');
    }

    const videoIndex = playlist.videos.indexOf(videoId);

    if (videoIndex === -1) {
        throw new ApiError(404, 'Video not found in playlist');
    }

    playlist.videos.splice(videoIndex, 1);

    const updatedPlaylist = await playlist.save();

    if (!updatedPlaylist) {
        throw new ApiError(500, 'Failed to remove video from playlist');
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                'Video removed from playlist successfully'
            )
        );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;

    if (!playlistId) {
        throw new ApiError(400, 'Playlist ID is required');
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, 'Invalid playlist ID');
    }

    const playlist = await Playlist.findByIdAndDelete(playlistId);

    if (!playlist) {
        throw new ApiError(404, 'Playlist not found');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, 'Playlist deleted successfully'));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;
    const {name, description} = req.body;

    if (!playlistId) {
        throw new ApiError(400, 'Playlist ID is required');
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, 'Invalid playlist ID');
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, 'Playlist not found');
    }

    if (name) {
        playlist.name = name;
    }

    if (description) {
        playlist.description = description;
    }

    const updatedPlaylist = await playlist.save();

    if (!updatedPlaylist) {
        throw new ApiError(500, 'Failed to update playlist');
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                'Playlist updated successfully'
            )
        );
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};
