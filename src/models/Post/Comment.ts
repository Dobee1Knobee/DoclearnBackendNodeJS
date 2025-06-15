import {InferSchemaType, model, Schema} from "mongoose";

const commentSchema = new Schema({
    postId : {type : Schema.Types.ObjectId,ref:"Post", required: true, index: true},
    authorId : {type : Schema.Types.ObjectId,ref:"User", required: true, index: true},
    text : {type : Schema.Types.String,required: true,minLength : 1,maxLength : 1000},
    parentId : {type : Schema.Types.ObjectId,ref:"Comment", default: null},
    stats: {
        likes:{type:Number,default:0},
        replies:{type:Number,default:0},
    },
    isDeleted: {type : Boolean,default: false},
    createdAt: {type : Date,default:Date.now},
    updatedAt: {type : Date,default:Date.now},
});
commentSchema.index({ postId: 1, createdAt: -1 }); // комментарии к посту
commentSchema.index({ parentId: 1, createdAt: 1 }); // ответы на комментарий
commentSchema.index({ authorId: 1, createdAt: -1 }); // комментарии пользователя
export type Comment = InferSchemaType<typeof commentSchema>;
export const CommentModel = model<Comment>("Comments", commentSchema);
