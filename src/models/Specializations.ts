import mongoose, { Schema, InferSchemaType, model, Model, Document } from 'mongoose';

const specializationSchema = new Schema({
    label: { type: String, required: true },
    value: { type: String, required: true },
    profile: { type: String, required: true },
    // Добавьте другие поля, которые есть в вашей коллекции
}, {
    timestamps: true
});

// Индексы
specializationSchema.index({ value: 1 });
specializationSchema.index({ profile: 1 });
specializationSchema.index({ label: 1 });

// Типы
export type Specialization = InferSchemaType<typeof specializationSchema>;
export type SpecializationDocument = Specialization & Document;

// Экспорт модели
export const SpecializationModel: Model<Specialization> = model<Specialization>('Specializations', specializationSchema);