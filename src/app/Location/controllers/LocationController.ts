import { Get, JsonController, Req, Res } from 'routing-controllers';
import { Validate } from '../../../lib/validator/Validator';

const axios = require('axios');

@JsonController()
export class LocationController {

    @Get('/locations')
    @Validate([
        {
            field: 'location', validation: [
                {value: 'notEmpty', message: 'location is required'}
            ]
        }])
    async find(@Req() req: any, @Res() res: any) {
        try {
            const URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?input=' +
                req.query.location + '&types=(cities)&language=en&key=' + process.env.GOOGLE_API;
            let body = (await axios.get(URL)).data;
            if (body.predictions) {
                return body.predictions.map((place: any) => place.description);
            }
            return [];
        } catch (error) {
            console.error(error);
            res.status(400).send(error);
        }
    }
}
