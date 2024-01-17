import {Schema, model} from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
        },
        thumbnail: {
            type: String, // URL
            required: [true, 'Thumbnail is required'],
        },
        videoUrl: {
            type: String, // URL
            required: [true, 'Video URL is required'],
        },
        duration: {
            type: Number,
            required: [true, 'Duration is required'],
        },
        viewCount: {
            type: Number,
            default: 0,
        },

        // Relationship
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

videoSchema.plugin(mongooseAggregatePaginate);
export const Video = model('Video', videoSchema);
