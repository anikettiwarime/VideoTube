import {Router} from 'express';
const router = Router();

import {verifyJWT} from '../middlewares/auth.middleware.js';
import {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
} from '../controllers/tweet.controller.js';

router.use(verifyJWT);

router.route('/').post(createTweet);
router.route('/user/:userId').get(getUserTweets);
router.route('/:tweetId').patch(updateTweet).delete(deleteTweet);

export default router;
