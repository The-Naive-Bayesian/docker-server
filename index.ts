import * as express from 'express';

const port = 3000;
const app = express();

app.get('/', (res, req) => {
    req.send('Hello, world!');
});

app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});
