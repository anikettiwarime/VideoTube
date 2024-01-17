import connectDB from './db/connectDB.js';
import {app} from './app.js';

connectDB()
    .then(
        app.listen(process.env.PORT, () => {
            console.log(`🚀 Server listening on port ${process.env.PORT}`);
        })
    )
    .catch((err) => console.log(err));
