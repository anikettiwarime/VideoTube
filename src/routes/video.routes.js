import {Router} from 'express';
const router = Router();

import {verifyJWT} from '../middlewares/auth.middleware.js';
import {upload} from '../middlewares/multer.middleware.js';
import {getVideoById, publishVideo} from '../controllers/video.controller.js';

router.use(verifyJWT);

router.route('/').post(
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

export default router;
