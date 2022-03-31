import { MongooseRepository } from '../../../lib/mongoose-typescript/MongooseRepository';

export class KeywordSearchUtil {
  repository: MongooseRepository;
  constructor(repository: MongooseRepository) {
    this.repository = repository;
  }

  async findSearchKeyword(keyword: string, keyList: any[]) {
    for (let i = 0; i < keyList.length; i++) {
      const path = keyList[i].populatePath;
      const property = keyList[i].searchProperty;
      let condition: any = {};
      condition[property] = { '$regex': keyword, '$options': 'i' };
      let sections = await this.repository.find({})
        .populate({
          path: path,
          match: {
            $or: [
              condition
            ]
          }
        });
      let count = sections.filter(o => o[path] != null).length;
      if (count > 0) {
        return {path, condition};
      }
    }
    return '';
  }
}
