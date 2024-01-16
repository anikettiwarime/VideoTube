import { Router } from "express";
const router = Router();

import { loginUser, logoutUser, registerUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateUser, updateUserAvatarImage, updateUserCoverImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

router.route("/register").post(
    upload.fields([
        {
            "name": "avatar",
            "maxCount": 1
        },
        {
            "name": "coverImage",
            "maxCount": 1
        }
    ])
    , registerUser);

router.route('/login').post(loginUser);

// Secret routes
router.route('/logout').post(verifyJWT, logoutUser);
router.route('/refresh-token').post(refreshAccessToken);
router.route('/change-password').post(verifyJWT, changeCurrentPassword);
router.route('/current-user').get(verifyJWT, getCurrentUser);
router.route('/update-account').patch(verifyJWT, updateUser);
router.route('/update-avatar').patch(verifyJWT, upload.single("avatar"), updateUserAvatarImage);
router.route('/update-cover-image').patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
router.route('/c/:username').get(verifyJWT, getUserChannelProfile);
router.route('/watch-history').get(verifyJWT, getWatchHistory);


export default router;