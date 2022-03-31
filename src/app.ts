import { PoolApplication } from './lib/app/PoolApplication';
import { auth } from './app/Session/services/passport/Auth';

require('moment-timezone').tz.setDefault('Etc/UTC');

class Application extends PoolApplication {
    // TODO review + refactor
    constructor() {
        if (process.env.NODE_ENV === 'test') {
            super(process.env.TEST_DATABASE);
        } else {
            super(process.env.DATABASE);
        }
        this.addLoader(this.loadPassport);

        this.addStarter(this.initElasticSearch);
        if (process.env.NODE_APP_INSTANCE === process.env.PM2_CRON_INSTANCE || process.env.ENVIRONMENT === 'development') {
            this.addStarter(this.startCrons);
        }

        this.init();
        process.on('unhandledRejection', (err: any) => {
            if (err) {
                console.error(err);
                console.error(err.message);
            }
        });
        process.on('uncaughtException', (err: any) => {
            console.error(err);
            console.error(err.message);
        });
    }

    initElasticSearch() {
        // let streamElasticSearch = new StreamElasticSearch();
        // streamElasticSearch.init()
        //     .then(() => {
        //         console.info('Stream Elasticsearch bulk add finished');
        //     });
    }

    loadPassport() {
        auth.init();
    }

    startCrons() {
//        googleCalendarWatcher.init();
    }

}

export let application = new Application();
