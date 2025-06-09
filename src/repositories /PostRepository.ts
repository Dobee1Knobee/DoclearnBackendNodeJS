import {CreatePostDto, PostFilterDto, UpdatePostDto} from "@/dto/PostDto";
import {Post, PostModel} from "@/models/Post/Post";
import mongoose, {Promise} from "mongoose";

export interface IPostInterface {
    create(postData:CreatePostDto,authorId:string):Promise<Post>;
    findById(id: string): Promise<Post | null>;
    findByIdRaw(id: string): Promise<Post | null>;

    findByAuthor(authorId:string,limit?:number,skip?:number):Promise<Post[]>;
    findFeed(limit?:number,skip?:number):Promise<Post[]>;
    findByFilter(filter:PostFilterDto):Promise<Post[]>;
    update(id:string,updateData:UpdatePostDto):Promise<Post | null>;
    delete(id:string):Promise<boolean>;
    incrementStats(id:string,field:"likes"|"comments"|"shares"|"views"):Promise<void>;
    decrementStats(id:string,field:"likes"|"comments"|"shares"):Promise<void>;
    checkIfUserLiked(userId:string,id:string):Promise<boolean>;
    addLike(postId:string,userId:string):Promise<boolean>;
}

export class IPostRepository implements IPostInterface {
    async create(postData:CreatePostDto,authorId:string):Promise<Post> {
        const post = await PostModel.create({
            authorId,
            content:{
                text:postData.text,
                images: postData.images || [],
                links : postData.links || [],
            },
            stats:{
                likes:0,
                comments:0,
                shares:0,
                views:0,
            },
            visibility : postData.visibility || "public",
            createdAt : new Date(),
        });
        return post.toObject();
    }
    async findByIdRaw(id: string): Promise<Post | null> {
        const post = await PostModel
            .findById(id)
            // БЕЗ .populate() - получаем только ObjectId
            .lean();

        return post;
    }
    async findById(id: string): Promise<Post | null> {
        const post = await PostModel
            .findById(id) // упрощаем, без isDeleted пока
            .populate('authorId', 'firstName lastName role')
            .lean();

        return post;
    }
    async findByAuthor(authorId: string, limit = 20, skip = 0): Promise<Post[]> {
        const posts = await PostModel
            .find({ authorId: new mongoose.Types.ObjectId(authorId) })
            .sort({ createdAt: -1 }) // новые сначала
            .limit(limit)
            .skip(skip)
            .populate('authorId', 'firstName lastName role')
            .lean();

        return posts;
    }
    async findFeed(limit = 20, skip = 0): Promise<Post[]> {
        const posts = await PostModel
            .find({}) // пока берем все посты
            .sort({ createdAt: -1 }) // новые сначала
            .limit(limit)
            .skip(skip)
            .populate('authorId', 'firstName lastName role')
            .lean();

        return posts;
    }
    async findByFilter(filter: PostFilterDto): Promise<Post[]> {
        const query: any = {};

        // Строим запрос на основе фильтров
        if (filter.specialty) {
            query['medical.specialty'] = filter.specialty;
        }

        if (filter.isCase !== undefined) {
            query['medical.isCase'] = filter.isCase;
        }

        if (filter.dateFrom || filter.dateTo) {
            query.createdAt = {};
            if (filter.dateFrom) query.createdAt.$gte = filter.dateFrom;
            if (filter.dateTo) query.createdAt.$lte = filter.dateTo;
        }

        const posts = await PostModel
            .find(query)
            .sort({ createdAt: -1 })
            .limit(filter.limit || 20)
            .skip(filter.skip || 0)
            .populate('authorId', 'firstName lastName role')
            .lean();

        return posts;
    }


    async update(id: string, updateData: UpdatePostDto): Promise<Post | null> {

        const post = await PostModel
            .findOneAndUpdate(
                { _id: id },
                {
                    $set: {
                        'content.text': updateData.text,
                        'medical.tags': updateData.medicalTags,
                        'medical.specialty': updateData.specialty,
                        'medical.difficulty': updateData.difficulty,
                        visibility: updateData.visibility,
                        updatedAt: new Date()
                    }
                },
                {
                    new: true,
                    runValidators: true, // ← ВОТ ЭТО!
                    context: 'query'     // ← И ЭТО!
                }// возвращаем обновленный документ
            )
            .populate('authorId', 'firstName lastName role')
            .lean();

        return post;
    }
    async delete(id: string): Promise<boolean> {
        // Пока делаем hard delete - проще для MVP
        const result = await PostModel.deleteOne({ _id: id });
        return result.deletedCount > 0;
    }
    async decrementStats(id: string, field: 'likes' | 'comments' | 'shares'): Promise<void> {
        await PostModel.updateOne(
            { _id: id },
            { $inc: { [`stats.${field}`]: -1 } }
        );
    }

    async incrementStats(id: string, field: 'likes' | 'comments' | 'shares' | 'views'): Promise<void> {

        await PostModel.updateOne(
            { _id: id },
            { $inc: { [`stats.${field}`]: 1 } } // атомарное увеличение
        );
    }


    async findBySpecialty(specialty: string, limit = 20, skip = 0): Promise<Post[]> {
        const posts = await PostModel
            .find({
                'medical.specialty': specialty,
                visibility: 'public',
                isDeleted: false
            })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .populate('authorId', 'firstName lastName role medical.specialty')
            .lean();

        return posts;
    }

    async findClinicalCases(limit = 20, skip = 0): Promise<Post[]> {
        const posts = await PostModel
            .find({
                'medical.isCase': true,
                visibility: 'public',
                isDeleted: false
            })
            .sort({ 'stats.likes': -1, createdAt: -1 }) // популярные случаи сначала
            .limit(limit)
            .skip(skip)
            .populate('authorId', 'firstName lastName role medical.specialty')
            .lean();

        return posts;
    }

    async checkIfUserLiked(postId: string, userId: string): Promise<boolean> {
        const userObjectId = new mongoose.Types.ObjectId(userId);

        const post = await PostModel.findOne({
            _id: postId,
            likedBy: userObjectId // ← MongoDB сам правильно сравнит
        }).lean();

        return !!post;
    }

    async addLike(postId: string, userId: string): Promise<boolean> {
        const userObjectId = new mongoose.Types.ObjectId(userId); // ← Конвертируем

        const result = await PostModel.updateOne(
            {
                _id: postId,
                likedBy: { $ne: userObjectId } // ← ObjectId
            },
            {
                $push: { likedBy: userObjectId }, // ← ObjectId
                $inc: { 'stats.likes': 1 }
            }
        );

        return result.modifiedCount > 0;
    }
    async deleteLike(postId: string, userId: string): Promise<boolean> {
        const userObjectId = new mongoose.Types.ObjectId(userId); // ← Конвертируем
        const result = await PostModel.updateOne(
            {
                _id: postId,
                likedBy:  userObjectId // ← ObjectId
            },
            {
                $pull: { likedBy: userObjectId }, // ← ObjectId
                $inc: { 'stats.likes': -1 }
            }
        );

        return result.modifiedCount > 0;    }
}
