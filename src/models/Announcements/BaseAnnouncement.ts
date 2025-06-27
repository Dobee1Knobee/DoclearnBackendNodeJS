import mongoose, { Schema, model } from 'mongoose';

const baseAnnouncementSchema = new Schema({
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
    timestamps: true // это автоматически добавит createdAt и updatedAt
});

export const BaseAnnouncementModel = model('Announcement', baseAnnouncementSchema);
export { baseAnnouncementSchema }; // для создания discriminators