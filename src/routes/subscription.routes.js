import {Router} from 'express';
const router = Router();

import {verifyJWT} from '../middlewares/auth.middleware.js';

router.use(verifyJWT);

import {
    toggleSubscription,
    getChannelSubscribers,
    getSubscribedChannels,
} from '../controllers/subscription.controller.js';

router.route('/c/:channelId').post(toggleSubscription);
router.route('/u/:channelId').get(getChannelSubscribers);
router.route('/c/:subscriberId').get(getSubscribedChannels);

export default router;
