import * as express from 'express';
import * as Docker from 'dockerode';
import {Request, Response} from "express";

// Server setup
const port = 4200;
const app = express();

// Shitty 'count' variable until i get better networking stuff going
let createdCount = 0;

// Docker setup
const docker = new Docker({socketPath: '/var/run/docker.sock'});

app.get('/', (req: Request, res: Response) => {
    docker.listContainers()
        .then(containers => {
            res.send({
                containers: containers.map(container => container.Id)
            });
        })
        .catch(err => {
            res.status(500);
            res.send(err);
        })
});

app.post('/', (req: Request, res: Response) => {
    // Roughly follows example here: https://github.com/apocas/dockerode/blob/master/examples/exec_running_container.js
    const hostPort = `${3000 + ++createdCount}`;
    const createOptions: {Image: string, Cmd: string[], Tty: boolean, ExposedPorts: any, HostConfig: any} = {
        Image: 'connection-counter',
        Cmd: [],
        Tty: false,
        ExposedPorts: {"3000/tcp": {}},
        HostConfig: {
            PortBindings: {
                [`3000/tcp`]: [
                    {HostPort: hostPort}
                ]
            },
        }
    };
    const runOptions = {
        Cmd: ["node", "index.js"],
        AttachStdin: false,
        AttachStdout: false,
    };

    docker.createContainer(createOptions, (err, container) => {
        if (err) {
            res.status(500);
            res.send(err);
        } else {
            container.start({}, (err, data) => {
                container.exec(runOptions);
                res.send({
                    id: container.id,
                    port: hostPort,
                });
            })
        }
    });
});

app.delete('/:containerId', (req: Request, res: Response) => {
    const {containerId} = req.params;

    const container = docker.getContainer(containerId);
    container.stop()
        .then(() => {
            return container.remove();
        })
        .then(() => {
            res.send({
                id: containerId,
            });
        })
        .catch(err => {
            res.status(500);
            res.send(err);
        });
});


app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});
