// src/controllers/PostController.ts

import { Request, Response, NextFunction } from "express";
import { PostService } from "@/services/PostService";
import { CreatePostDto, UpdatePostDto, PostFilterDto } from "@/dto/PostDto";
import { ApiError } from "@/errors/ApiError";
interface AuthenticatedRequest extends Request {
    user?: {  // ← ОПЦИОНАЛЬНОЕ!
        id: string;
        email: string;
        role: string;
    };
}
export class PostController {
    private postService: PostService;

    constructor() {
        this.postService = new PostService();

        // Биндим методы к контексту класса (важно для Express!)
        this.createPost = this.createPost.bind(this);
        this.getPostById = this.getPostById.bind(this);
        this.getUserPosts = this.getUserPosts.bind(this);
        this.getFeed = this.getFeed.bind(this);
        this.updatePost = this.updatePost.bind(this);
        this.deletePost = this.deletePost.bind(this);
        this.likePost = this.likePost.bind(this);
        this.unlikePost = this.unlikePost.bind(this);
        this.searchPosts = this.searchPosts.bind(this);
        this.getClinicalCases = this.getClinicalCases.bind(this);
    }

    async createPost(request: AuthenticatedRequest, response: Response,next: NextFunction) {
        try {
            const authorId = request.user?.id || "6842252cc6653b6673f39c90"
            const postData: CreatePostDto = {
                text: request.body.text,
                images: request.body.images || "",
                medicalTags: request.body.medicalTags || "",
                speciality: request.body.speciality || "",
                isCase : request.body.isCase || "",
                difficulty : request.body.difficulty || "",
                visibility : request.body.visibility || "",
                isAnonymous : request.body.isAnonymous || "",
                links : request.body.links || ""
            }

        }
        catch (error) {
            throw error;
        }
        throw new ApiError(500,"Ошибка при создании поста")
    }
}