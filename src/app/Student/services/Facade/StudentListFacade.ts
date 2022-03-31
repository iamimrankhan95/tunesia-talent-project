import { User } from '../../../User/data/models/User';
import { Student } from '../../../../../public/app/student/model/student.model';
import { userRepository } from '../../../User/data/repositories/UserRepository';

export class StudentListFacade {

    private readonly params: any;
    private readonly user: User;

    private condition: any = {};
    private sort: any = {createdAt: -1};
    private students: Student[];
    private total: number;
    private generatedSkip: number;

    constructor(params: any, user: User) {
        this.params = params;
        this.user = user;
    }

    async create() {
        await this.createCondition();
        await this.createSort();
        await this.fetchStudents();
        await this.fetchTotal();
        let result: any = {items: this.students, total: this.total};
        if (this.generatedSkip) {
            result.generateSkip = this.generatedSkip;
        }
        return result;
    }

    private async fetchTotal() {
        this.total = await userRepository.count(this.condition);

    }

    private async fetchStudents() {
        let {skip, limit, includeStudentId} = this.params;

        let query = userRepository.find(this.condition);
        if (typeof skip !== 'undefined') {
            query.skip(+skip).limit(+limit);
        }
        let students = await query.populate({path: 'university'})
            .sort(this.sort);
        if (includeStudentId) {
            let studentIndex = students.findIndex((o: any) => o._id.toString() === includeStudentId);
            let generatedSkip = Math.floor(studentIndex / (+limit)) * (+limit);
            students = students.slice(generatedSkip, generatedSkip + (+limit));
            this.generatedSkip = generatedSkip;
        }
        this.students = students;
    }

    private async createCondition() {
        this.condition.type = 'student';
        let {keyword} = this.params;
        if (keyword) {
            this.condition.$or = [
                {
                    name: {'$regex': keyword, '$options': 'i'}
                },
                {
                    email: {'$regex': keyword, '$options': 'i'}
                }
            ];
        }
    }

    private createSort() {
        let {sortKey, sortValue} = this.params;
        if (sortKey) {
            this.sort = {[sortKey]: (sortValue === 'descend' ? -1 : 1)};
        }
    }
}
