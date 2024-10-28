import {Router} from 'express';
const router = Router();

import {verifyJWT} from '../middlewares/auth.middleware.js';

router.use(verifyJWT);

import {
    toggleSubscription,
    getChannelSubscribers,
    getSubscribedChannels,
} from '../controllers/subscription.controller.js';

router.route('/subscribe/:channelId').post(toggleSubscription);
router.route('/subscribers/:channelId').get(getChannelSubscribers);
router.route('/subscribed').get(getSubscribedChannels);

export default router;
