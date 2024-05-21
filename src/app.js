import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import {ApiResponse} from './utils/ApiResponse.js';

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
    })
);

app.use(express.json({limit: '16kb'}));
app.use(express.urlencoded({extended: true, limit: '16kb'}));
app.use(express.static('public'));
app.use(cookieParser());

// Routes import
import userRoutes from './routes/user.routes.js';
import likeRoutes from './routes/like.routes.js';
import videoRoutes from './routes/video.routes.js';
import tweetRoutes from './routes/tweet.routes.js';
import commentRoutes from './routes/comment.routes.js';
import playlistRoutes from './routes/playlist.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import healthcheckRoutes from './routes/healthcheck.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';

// Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/likes', likeRoutes);
app.use('/api/v1/videos', videoRoutes);
app.use('/api/v1/tweets', tweetRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/playlists', playlistRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/healthcheck', healthcheckRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);

// Redirect from root to healthcheck route
app.get('/', (req, res) => {
    res.redirect(302, '/api/v1/healthcheck');
});

// 404 Route Handler
app.use('*', (req, res) => {
    res.status(404).json(new ApiResponse(404, null, 'Route not found'));
});

export {app};
