import { Schema } from 'mongoose';
import { BaseAnnouncementModel } from './BaseAnnouncement';

const conferenceSchema = new Schema({
    speakers: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        eventRole: {
            type: String,
            required: true,
            maxLength: 100
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'declined'],
            default: 'pending'
        }
    }],

    program: { type: String },

    format: {
        type: String,
        enum: ['online', 'offline', 'hybrid'],
        required: true
    }
});

export const ConferenceModel = BaseAnnouncementModel.discriminator('Conference', conferenceSchema);