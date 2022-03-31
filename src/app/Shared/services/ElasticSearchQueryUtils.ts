export class ElasticSearchQueryUtils {

    query: any;
    elasticQuery: any;

    constructor(query: any, elasticQuery: any) {
        this.query = query;
        this.elasticQuery = elasticQuery;
    }

    static searchById(indexName: string, ztoolId: string) {
        return {
            index: indexName,
            type: 'document',
            body: {
                query: {
                    match: {
                        id: ztoolId
                    }
                }
            }
        };
    }

    bindPayload() {
        if (this.query.payload) {
            let filterPayload: any = {
                must: {
                    query_string: {
                        query: this.query.payload.replace(/'/g, '"'),
                        fields: ['title', 'description', 'keywords', 'owner.name']
                    }
                }
            };
            Object.assign(this.elasticQuery.body.query.bool, filterPayload);
        }
    }

}
