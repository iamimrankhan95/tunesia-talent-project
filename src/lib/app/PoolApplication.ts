import 'reflect-metadata';
import { useExpressServer } from 'routing-controllers';
import { DB } from '../mongoose-typescript/DB';
import { customValidators } from '../validator/CustomValidators';
import { mailer } from '../mail/Mailer';
import { customSanitizers } from '../validator/CustomSanitizers';
import { enableProdMode } from '@angular/core';

require('dotenv').config();
const express = require('express');
const fs = require('fs');
const passport = require('passport');
const expressValidator = require('express-validator');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const winston = require('winston');

const faye = require('faye');

enableProdMode();


export class PoolApplication {
    app: any;
    port: number;
    databaseUri: string;
    middlewares: Function[];
    loaders: Function[];
    starters: Function[];
    host: string;
    io: any;
    db: DB;
    wait: Promise<boolean>;
    resolve: Function;
    redisClient: any;
    redisStore: any;

    constructor(databaseUri: string) {
        this.wait = new Promise((resolve: Function) => {
            this.resolve = resolve;
        });
        this.db = DB.getInstance();
        this.databaseUri = databaseUri;
        this.middlewares = [];
        this.starters = [];
        this.loaders = [];
        this.injectMiddlewares();
        this.injectLoaders();
    }

    init() {
        this.createServer();
        this.app.set('view engine', 'html');
        this.app.set('views', __dirname + '/../../public');
        this.initStaticFilesRedirection();
        this.loadMiddlewares();
        this.loadLoaders();
        this.initRouterController();
        this.connectDatabase();
        this.loadModels().then(() => {
            this.loadStarters();
            this.startServer();
        });
    }

    injectLoaders() {
        this.addLoader(() => {
            mailer.init();
        });
    }

    injectMiddlewares() {
        this.addMiddleware(cookieParser());
        this.addMiddleware(bodyParser.urlencoded({extended: true}));
        this.addMiddleware(bodyParser.json({limit: '200mb'}));
        this.addMiddleware(expressValidator({
            customValidators: customValidators.get(),
            customSanitizers: customSanitizers.get()
        }));
        this.addMiddleware(passport.initialize());
        this.addMiddleware(passport.session());

    }

    addMiddleware(middleware: Function) {
        this.middlewares.push(middleware);
    }

    addLoader(loader: Function) {
        this.loaders.push(loader);
    }

    addStarter(starter: Function) {
        this.starters.push(starter);
    }

    loadLoaders() {
        for (let loader of this.loaders) {
            loader.call(this);
        }
    }

    loadStarters() {
        for (let starter of this.starters) {
            starter.call(this);
        }
    }

    createServer() {
        this.app = express();
        if (process.env.ENVIRONMENT === 'production') {
            this.port = (parseInt(process.env.PORT, 10) || 5000) + parseInt(process.env.NODE_APP_INSTANCE, 10);
        } else {
            this.port = parseInt(process.env.PORT, 10) || 5000;
        }
        this.app.set('port', this.port);
    }

    loadMiddlewares() {
        for (let middleware of this.middlewares) {
            this.app.use(middleware);
        }
    }

    initRouterController() {
        this.app = useExpressServer(this.app, {
            routePrefix: '/api',
            controllers: [__dirname + '/../../app/**/controllers/*.js'],
            middlewares: [__dirname + '/../../app/**/middlewares/*.js']
        });
    }

    initStaticFilesRedirection() {
        this.app.use('/*', (req: any, res: any, next: Function) => {
            // TODO match a good regex so the /api only at the beginning
            if (req.baseUrl && (req.baseUrl.indexOf('/api') > -1 || req.baseUrl.indexOf('/faye') === 0)) {
                next();
            } else {
                if (req.baseUrl &&
                    (req.baseUrl.match(/\.*\.(js|html|css|mp3|jpg|jpeg|png|gif|svg|ttf|woff|woff2|ico|php|xml|txt|po|zip|mp4)\.*/g))) {
                    if (!fs.existsSync(__dirname + '/../../public' + req.baseUrl)) {
                        return res.redirect('/404');
                    } else {
                        return res.sendFile(path.resolve(__dirname, '../../public' + req.baseUrl));
                    }
                } else {
                    return res.sendFile(path.resolve(__dirname, '../../public/index.html'));
                }
            }
        });
    }

    connectDatabase() {
        if (process.env.NODE_ENV === 'test') {
            this.databaseUri = process.env.TEST_DATABASE;
        }
        if (process.env.NODE_ENV === 'dev') {
            this.databaseUri = process.env.DATABASE;
        }
        this.db.init(this.databaseUri);
    }

    loadModels() {
        return this.db.waitForModels();
    }

    load() {
        return this.wait;
    }

    startServer() {
        if (process.env.NODE_ENV === 'test') {
            this.host = process.env.TEST_HOST;
        }
        if (process.env.NODE_ENV === 'dev') {
            this.host = process.env.HOST;
        }
        const server = this.app.listen(this.port, '0.0.0.0', () => {
            winston.info('Node app is running at localhost:' + this.port);
            this.resolve(true);
        });

        const bayeux = new faye.NodeAdapter({mount: '/faye', timeout: 45});
        bayeux.attach(server);
    }
}
