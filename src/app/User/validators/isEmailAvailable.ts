import { userRepository } from '../data/repositories/UserRepository';

export const isEmailAvailable = (email: string) => {
    return new Promise((resolve: Function, reject: Function) => {

        userRepository
            .findOneWithDeleted({email})
            .then((user: any) => {
                if (!user) {
                    resolve();
                } else {
                    reject();
                }
            })
            .catch((error: any) => {
                reject(error);
            });
    });
};
