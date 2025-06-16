import { Schema, model, Document, ObjectId } from 'mongoose';

interface IRefreshToken extends Document {
    userId: ObjectId;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Автоматически удаляем истекшие токены
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel = model<IRefreshToken>('RefreshToken', refreshTokenSchema);
export type { IRefreshToken };