import mongoose, { Schema, model, Document } from 'mongoose';

// Добавляем интерфейс для типизации
export interface IBaseAnnouncement extends Document {
    title: string;
    description: string;
    organizer: mongoose.Types.ObjectId;
    activeFrom: Date;
    activeTo?: Date;
    status: 'draft' | 'pending' | 'approved' | 'published' | 'rejected' | 'archived' | 'moderator_removed';
    moderationNotes?: string;
    type: string; // discriminator key
    createdAt: Date; // из timestamps
    updatedAt: Date; // из timestamps
}

// Типизируем схему
const baseAnnouncementSchema = new Schema<IBaseAnnouncement>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    activeFrom: { type: Date, default: Date.now },
    activeTo: { type: Date },

    status: {
        type: String,
        enum: ['draft', 'pending', 'approved', 'published', 'rejected', 'archived', 'moderator_removed'],
        default: 'draft'
    },
    moderationNotes: String
}, {
    discriminatorKey: 'type',
    timestamps: true
});
baseAnnouncementSchema.index({
    status: 1,
    activeFrom: 1,
    activeTo: 1
});

baseAnnouncementSchema.index({ organizer: 1 });
baseAnnouncementSchema.index({ createdAt: -1 })
// Типизируем модель
export const BaseAnnouncementModel = model<IBaseAnnouncement>('Announcement', baseAnnouncementSchema);
export { baseAnnouncementSchema };

// Экспортируем тип для использования в репозитории
export type BaseAnnouncement = IBaseAnnouncement;
