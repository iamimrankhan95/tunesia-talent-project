import { lectureRepository } from './../../Lecture/data/repositories/LectureRepository';
import { chapterRepository } from './../../Chapter/data/repositories/ChapterRepository';
import { courseRepository } from '../data/repositories/CourseRepository';
import { S3 } from '../../Asset/services/S3';

const unzipper = require('unzipper');
const pdf = require('pdf-parse');
const { getVideoDurationInSeconds } = require('get-video-duration');

export class CourseUploader {


    constructor(zipFile: any, ownerId: string) {
        this.zipFile = zipFile;
        this.ownerId = ownerId;
    }

    private zipFile: any;
    private contentFolder: any;
    private courseStructure: any;
    private newCourse: any;
    private ownerId: string;

    static countWords(text: string) {
        const regEx = /([^\u0000-\u007F]|\w)+/g;
        return text.match(regEx).length;
    }

    public async upload() {
        await this.unzipContentFile();
        await this.extractCourseStructure();
        await this.fillCourseContent();
        return this.courseStructure;
    }

    private async unzipContentFile() {
        const directory = await unzipper.Open.buffer(this.zipFile.buffer);
        this.contentFolder = directory.files;
    }

    private async extractCourseStructure() {
        let contentPath = this.contentFolder.find(filePath => filePath.path.includes('content.pdf'));
        let courseStructureFileBuffer = await contentPath.buffer();
        let fileContent = await pdf(courseStructureFileBuffer);
        this.courseStructure = await this.parseCourseStructure(fileContent.text);
    }

    private async parseCourseStructure(data: string) {
        let lines = data.split('\n');
        let courseStructure = {
            title: null,
            chapters: [],
            resources: [],
        };
        let lesson = { title: null, content: [] };
        let flag = 'inside Lesson';
        let finalCall = true;
        for (let index in lines) {
            let element = lines[index].toString();
            if (finalCall) {
                if (element != null && element) {
                    if (!courseStructure.title) {
                        courseStructure.title = element;
                    } else {

                        if (element.startsWith('Lesson') || element.startsWith('Resources:')) {
                            if (element.startsWith('Lesson')) {
                                if (lesson.title) {
                                    if (lesson.content.length) {
                                        lesson.title = lesson.title.trim();
                                        courseStructure.chapters.push({ chapter: { ...lesson } });
                                    }
                                    let title = element.split(':');
                                    lesson.title = title[1];
                                    lesson.content = [];
                                } else {
                                    let title = element.split(':');
                                    lesson.title = title[1];
                                    lesson.content = [];
                                }
                                flag = 'inside Lesson';
                            }
                            if (element.startsWith('Resources:')) {
                                flag = 'inside Resources';
                            }
                        } else {

                            if (flag === 'inside Lesson') {
                                let chapterTitle = element.split(':');
                                if (chapterTitle && chapterTitle.length > 1) {
                                    let z = chapterTitle[1];
                                    let type = z.split('-');
                                    lesson.content.push(type[0]);
                                }
                            }
                            if (flag === 'inside Resources') {
                                let resTitle = element;
                                if (resTitle.length > 5) {
                                    courseStructure.resources.push(resTitle.substring(2));
                                } else {
                                    flag = null;
                                    finalCall = false;
                                }
                            }
                        }
                    }
                }
            }
        }
        return courseStructure;
    }

    private async fillCourseContent() {
        for (let lessonIndex = 0; lessonIndex < this.courseStructure.chapters.length; lessonIndex++) {
            let currentChapter = this.courseStructure.chapters[lessonIndex];
            for (let topicIndex = 0; topicIndex < currentChapter.chapter.content.length; topicIndex++) {
                const contentPaths = this.contentFolder.filter(filePath => filePath.path.includes('Lesson ' + (lessonIndex + 1) + ' Topic ' + (topicIndex + 1)));
                if (!contentPaths || contentPaths.length === 0) {
                    continue;
                }

                for (let contentPath of contentPaths) {
                    let buffer = await contentPath.buffer();
                    let result = await S3.getInstance().uploadBuffer(buffer, 'Lesson' + (lessonIndex + 1) + ' Topic' + (topicIndex + 1), process.env.BUCKET);
                    const page = await this.getPage(contentPath.path.split('.').pop(), result, contentPath);
                    if (this.courseStructure.chapters[lessonIndex].chapter.content[topicIndex] && this.courseStructure.chapters[lessonIndex].chapter.content[topicIndex].pages) {
                        this.courseStructure.chapters[lessonIndex].chapter.content[topicIndex].pages.push(page);
                    } else {
                        this.courseStructure.chapters[lessonIndex].chapter.content[topicIndex] = { title: this.courseStructure.chapters[lessonIndex].chapter.content[topicIndex].trim(), pages: [page] };
                    }
                }
            }
        }
    }

    public async createCourse() {
        let { title, resources } = this.courseStructure;
        this.newCourse = await courseRepository.create({
            title, resources,
            owner: this.ownerId
        });
        let chapterIds = await this.createChapters(this.courseStructure.chapters);
    }

    private async createLessons(lectures: any[]) {
        let lectureIds = [];
        for (let lecture of lectures) {
            let title = lecture.title;
            let pages = lecture.pages;
            let result = await lectureRepository.create({
                title, pages,
                owner: this.ownerId
            });
            lectureIds.push(result._id);
        }
        return lectureIds;
    }

    private async createChapters(chapters: any[]) {
        let chaptersIds = [];
        for (let chapter of chapters) {
            let { title, content } = chapter.chapter;
            let lectures = await this.createLessons(content);
            let result = await chapterRepository.create({
                title, lectures,
                course: this.newCourse._id,
                owner: this.ownerId
            });
            chaptersIds.push(result._id);
        }
        return chaptersIds;
    }

    private async getPage(fileExtension: string, link: any, content: any) {
        const page: any = {};
        switch (fileExtension.toLowerCase()) {
            case 'pdf': {
                let pdfInfo = await pdf(await content.buffer());
                const wordCount = CourseUploader.countWords(pdfInfo.text);
                // 250 words equals 1 minutes and here we're storing time in seconds
                page.time = Math.floor((wordCount / 250) * 60);
                page.html = `<div class="pdf-container"><iframe src="${link}"></iframe></div>`;
                break;
            }
            case 'webm':
            case 'mpg':
            case 'mp2':
            case 'mpeg':
            case 'mpe':
            case 'mpv':
            case 'ogg':
            case 'm4p':
            case 'm4v':
            case 'avi':
            case 'wmv':
            case 'mov':
            case 'qt':
            case 'flv':
            case 'swf':
            case 'avchd':
            case 'mp4': {
                page.time = await getVideoDurationInSeconds(content.stream());
                page.video = link;
                break;
            }
            case 'jpeg':
            case 'jpg':
            case 'gif':
            case 'psd':
            case 'svg':
            case 'png':
            case 'bmp':
            case 'webp':
            case 'ppm':
            case 'pgm':
            case 'pbm':
            case 'pnm':
            case 'bpg':
            case 'deep':
            case 'drw':
            case 'ico':
            case 'img':
            case 'tif':
            case 'tiff': {
                page.html = `<div class="image-container"><img src="${link}"></div>`;
                break;
            }
            case 'html': {
                const contentBuffer = await content.buffer();
                const contentString = contentBuffer.toString();
                const images = contentString.split('<img ').length - 1;
                // 1 minutes for each image
                page.time = images * 60;
                page.html = contentString;
                break;
            }
        }

        return page;
    }
}
