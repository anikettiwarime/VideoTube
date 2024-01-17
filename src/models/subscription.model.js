import {Schema, model} from 'mongoose';

const subscriptionSchema = new Schema(
    {
        // one who is subscribing
        subscriber: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        channel: {
            // One to whom the subscriber is subscribing
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

export default Subscription = model('Subscription', subscriptionSchema);
