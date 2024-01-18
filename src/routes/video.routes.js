import {Router} from 'express';
const router = Router();

import {verifyJWT} from '../middlewares/auth.middleware.js';
import {upload} from '../middlewares/multer.middleware.js';
import {
    getAllVideos,
    getVideoById,
    publishVideo,
    togglePublishStatus,
} from '../controllers/video.controller.js';

router.use(verifyJWT);

router
    .route('/')
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: 'videoFile',
                maxCount: 1,
            },
            {
                name: 'thumbnail',
                maxCount: 1,
            },
        ]),
        publishVideo
    );

router.route('/:videoId').get(getVideoById);
router.route('/toggle/publish/:videoId').patch(togglePublishStatus);

export default router;
