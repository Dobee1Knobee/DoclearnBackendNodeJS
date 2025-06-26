import { Schema } from 'mongoose';
import { BaseAnnouncementModel } from './BaseAnnouncement';

const webinarSchema = new Schema({
    speakers: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, required: true, maxlength: 100 },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'declined'],
            default: 'pending'
        }
    }],

    platform: {
        type: String,
        enum: ['zoom', 'teams', 'youtube', 'google_meet', 'other'],
        required: true
    },

    isRecorded: { type: Boolean, default: false },

    participantLimit: { type: Number },
    registrationLink: { type: String },
    contactEmail: { type: String },
    contactPhone: { type: String },
    recordingLink: { type: String },

    price: { type: Number, default: 0 },
    tags: [{ type: String }]
});

export const WebinarModel = BaseAnnouncementModel.discriminator('Webinar', webinarSchema);